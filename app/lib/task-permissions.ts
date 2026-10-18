import type { Session } from "next-auth";
import prisma from "@/app/lib/prisma";

export type TaskActor = NonNullable<Session["user"]>;

export function taskVisibilityWhere(actor: TaskActor) {
  return actor.role === "ADMIN" ? {} : { assigneeId: actor.id };
}

export async function canAccessTask(taskId: string, actor: TaskActor) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...taskVisibilityWhere(actor),
    },
    select: { id: true, assigneeId: true },
  });

  return task;
}
