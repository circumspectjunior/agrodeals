const WHISP_BASE_URL = "https://whisp.openforis.org/api";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15;

export type EudrCheckStatus = "not_configured" | "pending" | "failed" | "complete";

export type EudrCheckResult = {
  status: EudrCheckStatus;
  risk: string | null;
};

type WhispStatusResponse = {
  code: string;
  data?: {
    features?: Array<{
      properties?: {
        risk_pcrop?: string;
      };
    }>;
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Submits a plot's coordinates to Whisp and polls for a deforestation-risk
// result. Never fabricates a status: returns `not_configured` (no network
// call at all) when there's no API key, rather than a placeholder value.
export async function getEudrRiskStatus(lat: number, lng: number): Promise<EudrCheckResult> {
  const apiKey = process.env.WHISP_API_KEY;

  if (!apiKey) {
    return { status: "not_configured", risk: null };
  }

  let token: string;
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

    const submitData = (await submitResponse.json()) as { token?: string };
    if (!submitData.token) {
      console.error("Whisp submit response missing token:", submitData);
      return { status: "failed", risk: null };
    }
    token = submitData.token;
  } catch (err) {
    console.error("Whisp submit request threw:", err);
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

      const statusData = (await statusResponse.json()) as WhispStatusResponse;
      const feature = statusData.data?.features?.[0];

      if (feature) {
        const risk = feature.properties?.risk_pcrop;
        if (!risk) {
          console.error("Whisp result missing risk_pcrop:", statusData);
          return { status: "failed", risk: null };
        }
        return { status: "complete", risk };
      }
    } catch (err) {
      console.error("Whisp status poll threw:", err);
      return { status: "failed", risk: null };
    }
  }

  return { status: "pending", risk: null };
}
