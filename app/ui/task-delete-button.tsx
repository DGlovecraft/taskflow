"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TaskDeleteButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function removeTask() {
    if (!window.confirm("ยืนยันลบงานนี้หรือไม่?")) {
      return;
    }

    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!response.ok) {
        const result: { error?: string } = await response.json();
        setError(result.error ?? "ลบงานไม่สำเร็จ");
        return;
      }
      router.refresh();
    } catch (cause) {
      console.error(cause);
      setError("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={removeTask}
        disabled={pending}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "กำลังลบ..." : "ลบ"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
