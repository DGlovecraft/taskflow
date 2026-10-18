import { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { errorResponse, isJsonRequest, validationError } from "@/app/lib/api-response";
import prisma from "@/app/lib/prisma";
import { canAccessTask } from "@/app/lib/task-permissions";
import { taskUpdateSchema } from "@/app/lib/task-validation";

type TaskRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: TaskRouteContext) {
  const session = await auth();
  if (!session?.user) {
    return errorResponse("กรุณาเข้าสู่ระบบ", 401);
  }

  const { id } = await params;
  const task = await prisma.task.findFirst({
    where: {
      id,
      ...(session.user.role === "ADMIN" ? {} : { assigneeId: session.user.id }),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  if (!task) {
    return errorResponse("ไม่พบงานหรือคุณไม่มีสิทธิ์เข้าถึง", 404);
  }
  return NextResponse.json({ task });
}

export async function PUT(request: Request, { params }: TaskRouteContext) {
  const session = await auth();
  if (!session?.user) {
    return errorResponse("กรุณาเข้าสู่ระบบ", 401);
  }
  if (!isJsonRequest(request)) {
    return errorResponse("Content-Type ต้องเป็น application/json", 415);
  }

  const { id } = await params;
  const existingTask = await canAccessTask(id, session.user);
  if (!existingTask) {
    return errorResponse("ไม่พบงานหรือคุณไม่มีสิทธิ์แก้ไข", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("รูปแบบ JSON ไม่ถูกต้อง", 400);
  }
  const parsed = taskUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }
  if (
    session.user.role !== "ADMIN" &&
    Object.prototype.hasOwnProperty.call(parsed.data, "assigneeId")
  ) {
    return errorResponse("เฉพาะผู้ดูแลระบบเท่านั้นที่เปลี่ยนผู้รับผิดชอบได้", 403);
  }

  let assigneeId: string | undefined;
  if (session.user.role === "ADMIN" && parsed.data.assigneeId !== undefined) {
    const assignee = await prisma.user.findUnique({
      where: { id: parsed.data.assigneeId },
      select: { id: true },
    });
    if (!assignee) {
      return errorResponse("ไม่พบบัญชีผู้รับผิดชอบ", 400);
    }
    assigneeId = assignee.id;
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description }
        : {}),
      ...(parsed.data.dueDate !== undefined
        ? {
            dueDate: parsed.data.dueDate
              ? new Date(`${parsed.data.dueDate}T00:00:00.000Z`)
              : null,
          }
        : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.priority !== undefined ? { priority: parsed.data.priority } : {}),
      ...(assigneeId ? { assigneeId } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ task });
}

export async function DELETE(_request: Request, { params }: TaskRouteContext) {
  const session = await auth();
  if (!session?.user) {
    return errorResponse("กรุณาเข้าสู่ระบบ", 401);
  }

  const { id } = await params;
  const task = await canAccessTask(id, session.user);
  if (!task) {
    return errorResponse("ไม่พบงานหรือคุณไม่มีสิทธิ์ลบ", 404);
  }

  try {
    await prisma.task.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return errorResponse("ไม่พบงานนี้", 404);
    }
    throw error;
  }

  return new NextResponse(null, { status: 204 });
}
