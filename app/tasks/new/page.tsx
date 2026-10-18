import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppHeader from "@/app/ui/app-header";
import TaskForm from "@/app/ui/task-form";
import prisma from "@/app/lib/prisma";

export default async function NewTaskPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
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
          New task
        </p>
        <h1 className="mb-6 mt-1 text-3xl font-bold">สร้างงานใหม่</h1>
        <TaskForm
          assignees={assignees}
          isAdmin={session.user.role === "ADMIN"}
        />
      </main>
    </>
  );
}
