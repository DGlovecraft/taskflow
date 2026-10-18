import Link from "next/link";
import type { Prisma, TaskPriority, TaskStatus } from "@/app/generated/prisma/client";
import TaskDeleteButton from "@/app/ui/task-delete-button";

const statusLabels: Record<TaskStatus, string> = {
  TODO: "รอดำเนินการ",
  IN_PROGRESS: "กำลังทำ",
  DONE: "เสร็จแล้ว",
};

const statusClasses: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  DONE: "bg-emerald-100 text-emerald-800",
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: "ต่ำ",
  MEDIUM: "ปานกลาง",
  HIGH: "สูง",
};

const priorityClasses: Record<TaskPriority, string> = {
  LOW: "text-slate-600",
  MEDIUM: "text-amber-700",
  HIGH: "text-red-700",
};

export default function TaskList({
  tasks,
  isAdmin,
}: {
  tasks: Prisma.TaskGetPayload<{
    include: { assignee: { select: { id: true; name: true; email: true } } };
  }>[];
  isAdmin: boolean;
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold">ยังไม่มีงานที่ตรงกับเงื่อนไข</h2>
        <p className="mt-2 text-sm text-slate-600">
          ลองปรับตัวกรอง หรือสร้างงานใหม่
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-lg font-semibold">{task.title}</h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[task.status]}`}
                >
                  {statusLabels[task.status]}
                </span>
              </div>
              {task.description && (
                <p className="mt-2 whitespace-pre-line break-words text-sm text-slate-600">
                  {task.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                <span className={priorityClasses[task.priority]}>
                  ความสำคัญ: {priorityLabels[task.priority]}
                </span>
                <span>
                  ครบกำหนด:{" "}
                  {task.dueDate
                    ? task.dueDate.toLocaleDateString("th-TH", {
                        timeZone: "UTC",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "ไม่กำหนด"}
                </span>
                {isAdmin && <span>ผู้รับผิดชอบ: {task.assignee.name}</span>}
              </div>
            </div>
            <div className="flex shrink-0 items-start gap-2">
              <Link
                href={`/tasks/${task.id}/edit`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
              >
                แก้ไข
              </Link>
              <TaskDeleteButton taskId={task.id} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
