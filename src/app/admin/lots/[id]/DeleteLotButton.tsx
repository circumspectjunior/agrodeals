"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteLot } from "@/app/admin/lots/[id]/actions";

export function DeleteLotButton({ lotId }: { lotId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleClick() {
    setDeleting(true);
    setError(null);

    const result = await deleteLot(lotId);

    if ("error" in result) {
      setError(result.error);
      setDeleting(false);
      return;
    }

    router.push("/admin/lots");
    router.refresh();
  }

  return (
    <div className="mt-2">
      <button
        onClick={handleClick}
        disabled={deleting}
        className="text-sm font-medium text-red-600 underline disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete lot"}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
