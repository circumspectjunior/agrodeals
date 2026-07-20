"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recheckEudrStatus } from "@/app/admin/farmers/[id]/actions";

export function RecheckEudrButton({ plotId }: { plotId: string }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setChecking(true);
    setError(null);

    const result = await recheckEudrStatus(plotId);

    if ("error" in result) {
      setError(result.error);
      setChecking(false);
      return;
    }

    router.refresh();
    setChecking(false);
  }

  return (
    <div className="mt-1">
      <button
        onClick={handleClick}
        disabled={checking}
        className="text-sm font-medium text-zinc-900 underline disabled:opacity-50 dark:text-zinc-50"
      >
        {checking ? "Checking…" : "Recheck EUDR status"}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
