"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { TaskPriority, TaskStatus } from "@/app/generated/prisma/client";

export type TaskFormValues = {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
};

export type AssigneeOption = {
  id: string;
  name: string;
  email: string;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100";

export default function TaskForm({
  task,
  assignees,
  isAdmin,
}: {
  task?: TaskFormValues;
  assignees: AssigneeOption[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      dueDate: String(formData.get("dueDate") ?? "") || null,
      status: String(formData.get("status") ?? ""),
      priority: String(formData.get("priority") ?? ""),
      ...(isAdmin ? { assigneeId: String(formData.get("assigneeId") ?? "") } : {}),
    };

    try {
      const response = await fetch(task ? `/api/tasks/${task.id}` : "/api/tasks", {
        method: task ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: { error?: string; details?: { message: string }[] } =
        await response.json();

      if (!response.ok) {
        setError(
          result.details?.map((detail) => detail.message).join(" ") ||
            result.error ||
            "บันทึกงานไม่สำเร็จ",
        );
        return;
      }

      router.push("/tasks");
      router.refresh();
    } catch (cause) {
      console.error(cause);
      setError("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <label className="block text-sm font-medium">
        ชื่องาน <span className="text-red-600">*</span>
        <input
          name="title"
          required
          maxLength={120}
          defaultValue={task?.title ?? ""}
          className={inputClass}
          placeholder="เช่น เตรียมรายงานประจำสัปดาห์"
        />
      </label>
      <label className="block text-sm font-medium">
        รายละเอียด
        <textarea
          name="description"
          rows={4}
          maxLength={5000}
          defaultValue={task?.description ?? ""}
          className={inputClass}
          placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
        />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          วันครบกำหนด
          <input
            name="dueDate"
            type="date"
            defaultValue={task?.dueDate ?? ""}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          สถานะ
          <select
            name="status"
            defaultValue={task?.status ?? "TODO"}
            className={inputClass}
          >
            <option value="TODO">รอดำเนินการ</option>
            <option value="IN_PROGRESS">กำลังทำ</option>
            <option value="DONE">เสร็จแล้ว</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          ความสำคัญ
          <select
            name="priority"
            defaultValue={task?.priority ?? "MEDIUM"}
            className={inputClass}
          >
            <option value="LOW">ต่ำ</option>
            <option value="MEDIUM">ปานกลาง</option>
            <option value="HIGH">สูง</option>
          </select>
        </label>
        {isAdmin && (
          <label className="block text-sm font-medium">
            ผู้รับผิดชอบ
            <select
              name="assigneeId"
              required
              defaultValue={task?.assigneeId ?? assignees[0]?.id ?? ""}
              className={inputClass}
            >
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name} ({assignee.email})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          disabled={pending || (isAdmin && assignees.length === 0)}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก..." : task ? "บันทึกการแก้ไข" : "สร้างงาน"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/tasks")}
          className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium hover:bg-slate-50"
        >
          ยกเลิก
        </button>
      </div>
      {isAdmin && assignees.length === 0 && (
        <p className="text-sm text-amber-700">
          ยังไม่มีสมาชิกให้กำหนดเป็นผู้รับผิดชอบ
        </p>
      )}
    </form>
  );
}
