import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import AppHeader from "@/app/ui/app-header";
import TaskForm from "@/app/ui/task-form";
import prisma from "@/app/lib/prisma";

type EditTaskPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const task = await prisma.task.findFirst({
    where: {
      id,
      ...(session.user.role === "ADMIN" ? {} : { assigneeId: session.user.id }),
    },
  });
  if (!task) {
    notFound();
  }

  const assignees =
    session.user.role === "ADMIN"
      ? await prisma.user.findMany({
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : [];

  return (
    <>
      <AppHeader user={session.user} />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
          Edit task
        </p>
        <h1 className="mb-6 mt-1 text-3xl font-bold">แก้ไขงาน</h1>
        <TaskForm
          task={{
            id: task.id,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate?.toISOString().slice(0, 10) ?? "",
            status: task.status,
            priority: task.priority,
            assigneeId: task.assigneeId,
          }}
          assignees={assignees}
          isAdmin={session.user.role === "ADMIN"}
        />
      </main>
    </>
  );
}
