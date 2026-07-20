const WHISP_BASE_URL = "https://whisp.openforis.org/api";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15;

export type EudrCheckStatus = "not_configured" | "pending" | "failed" | "complete";

export type EudrCheckResult = {
  status: EudrCheckStatus;
  risk: string | null;
};

// Whisp's actual response shape (verified live) differs from its docs: both
// /submit/geojson and /status/{token} return this same envelope. A submit
// can complete synchronously (code "analysis_completed") — polling only
// kicks in when it doesn't.
type WhispApiResponse = {
  code: string;
  message?: string;
  data?: {
    features?: Array<{
      properties?: {
        risk_pcrop?: string;
      };
    }>;
  };
  context?: {
    token?: string;
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractRisk(response: WhispApiResponse): string | null {
  return response.data?.features?.[0]?.properties?.risk_pcrop ?? null;
}

// Submits a plot's coordinates to Whisp and, if not already complete,
// polls for a deforestation-risk result. Never fabricates a status:
// returns `not_configured` (no network call at all) when there's no API
// key, rather than a placeholder value.
export async function getEudrRiskStatus(lat: number, lng: number): Promise<EudrCheckResult> {
  const apiKey = process.env.WHISP_API_KEY;

  if (!apiKey) {
    return { status: "not_configured", risk: null };
  }

  let submitData: WhispApiResponse;
  try {
    const submitResponse = await fetch(`${WHISP_BASE_URL}/submit/geojson`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            properties: {},
          },
        ],
      }),
    });

    if (!submitResponse.ok) {
      console.error(
        `Whisp submit failed: ${submitResponse.status} ${await submitResponse.text()}`,
      );
      return { status: "failed", risk: null };
    }

    submitData = (await submitResponse.json()) as WhispApiResponse;
  } catch (err) {
    console.error("Whisp submit request threw:", err);
    return { status: "failed", risk: null };
  }

  if (submitData.code === "analysis_completed") {
    const risk = extractRisk(submitData);
    if (!risk) {
      console.error("Whisp result missing risk_pcrop:", submitData);
      return { status: "failed", risk: null };
    }
    return { status: "complete", risk };
  }

  const token = submitData.context?.token;
  if (!token) {
    console.error("Whisp submit response missing context.token:", submitData);
    return { status: "failed", risk: null };
  }

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    try {
      const statusResponse = await fetch(`${WHISP_BASE_URL}/status/${token}`, {
        headers: { "X-API-KEY": apiKey },
      });

      if (!statusResponse.ok) {
        console.error(
          `Whisp status poll failed: ${statusResponse.status} ${await statusResponse.text()}`,
        );
        return { status: "failed", risk: null };
      }

      const statusData = (await statusResponse.json()) as WhispApiResponse;

      if (statusData.code === "analysis_completed") {
        const risk = extractRisk(statusData);
        if (!risk) {
          console.error("Whisp result missing risk_pcrop:", statusData);
          return { status: "failed", risk: null };
        }
        return { status: "complete", risk };
      }
      // Any other code means still processing — keep polling.
    } catch (err) {
      console.error("Whisp status poll threw:", err);
      return { status: "failed", risk: null };
    }
  }

  return { status: "pending", risk: null };
}
