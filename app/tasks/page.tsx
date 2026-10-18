import Link from "next/link";
import { Prisma, type TaskPriority, type TaskStatus } from "@/app/generated/prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppHeader from "@/app/ui/app-header";
import TaskList from "@/app/ui/task-list";
import prisma from "@/app/lib/prisma";
import { taskQuerySchema } from "@/app/lib/task-validation";

type TasksPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function singleValue(value: string | string[] | undefined) {
  return typeof value === "string" && value !== "" ? value : undefined;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const parsed = taskQuerySchema.safeParse({
    q: singleValue(params.q),
    status: singleValue(params.status),
    priority: singleValue(params.priority),
    assigneeId: singleValue(params.assigneeId),
    dueFrom: singleValue(params.dueFrom),
    dueTo: singleValue(params.dueTo),
  });

  const filterError = !parsed.success
    ? parsed.error.issues[0]?.message
    : parsed.data.dueFrom &&
        parsed.data.dueTo &&
        parsed.data.dueFrom > parsed.data.dueTo
      ? "วันเริ่มต้นต้องไม่อยู่หลังวันสิ้นสุด"
      : undefined;

  const filter = parsed.success && !filterError ? parsed.data : {};
  const where: Prisma.TaskWhereInput = {
    ...(session.user.role === "ADMIN" ? {} : { assigneeId: session.user.id }),
    ...(filter.q
      ? {
          OR: [
            { title: { contains: filter.q } },
            { description: { contains: filter.q } },
          ],
        }
      : {}),
    ...(filter.status ? { status: filter.status as TaskStatus } : {}),
    ...(filter.priority ? { priority: filter.priority as TaskPriority } : {}),
    ...(session.user.role === "ADMIN" && filter.assigneeId
      ? { assigneeId: filter.assigneeId }
      : {}),
    ...(filter.dueFrom || filter.dueTo
      ? {
          dueDate: {
            ...(filter.dueFrom
              ? { gte: new Date(`${filter.dueFrom}T00:00:00.000Z`) }
              : {}),
            ...(filter.dueTo
              ? {
                  lt: new Date(
                    new Date(`${filter.dueTo}T00:00:00.000Z`).getTime() +
                      86_400_000,
                  ),
                }
              : {}),
          },
        }
      : {}),
  };

  const [tasks, assignees] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
    session.user.role === "ADMIN"
      ? prisma.user.findMany({
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <>
      <AppHeader user={session.user} />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
              Task board
            </p>
            <h1 className="mt-1 text-3xl font-bold">
              {session.user.role === "ADMIN" ? "งานทั้งหมด" : "งานของฉัน"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {session.user.role === "ADMIN"
                ? "คุณกำลังดูงานทั้งหมดในระบบ"
                : "ติดตามงานที่คุณรับผิดชอบ"}
            </p>
          </div>
          <Link
            href="/tasks/new"
            className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700"
          >
            + สร้างงานใหม่
          </Link>
        </div>

        <form
          method="get"
          action="/tasks"
          className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6"
        >
          <label className="text-sm font-medium lg:col-span-2">
            ค้นหางาน
            <input
              name="q"
              defaultValue={singleValue(params.q)}
              placeholder="ชื่อหรือรายละเอียด"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium">
            สถานะ
            <select
              name="status"
              defaultValue={singleValue(params.status) ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">ทั้งหมด</option>
              <option value="TODO">รอดำเนินการ</option>
              <option value="IN_PROGRESS">กำลังทำ</option>
              <option value="DONE">เสร็จแล้ว</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            ความสำคัญ
            <select
              name="priority"
              defaultValue={singleValue(params.priority) ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">ทั้งหมด</option>
              <option value="LOW">ต่ำ</option>
              <option value="MEDIUM">ปานกลาง</option>
              <option value="HIGH">สูง</option>
            </select>
          </label>
          {session.user.role === "ADMIN" && (
            <label className="text-sm font-medium">
              ผู้รับผิดชอบ
              <select
                name="assigneeId"
                defaultValue={singleValue(params.assigneeId) ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">ทุกคน</option>
                {assignees.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-sm font-medium">
            ครบกำหนดตั้งแต่
            <input
              name="dueFrom"
              type="date"
              defaultValue={singleValue(params.dueFrom)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium">
            ถึง
            <input
              name="dueTo"
              type="date"
              defaultValue={singleValue(params.dueTo)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              ค้นหา / กรอง
            </button>
            <Link
              href="/tasks"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              ล้างตัวกรอง
            </Link>
            <span className="ml-auto text-sm text-slate-600">
              {tasks.length} งาน
            </span>
          </div>
        </form>

        {filterError && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {filterError}
          </p>
        )}
        <TaskList tasks={tasks} isAdmin={session.user.role === "ADMIN"} />
      </main>
    </>
  );
}
