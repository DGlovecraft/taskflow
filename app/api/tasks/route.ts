import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { errorResponse, isJsonRequest, validationError } from "@/app/lib/api-response";
import prisma from "@/app/lib/prisma";
import { taskCreateSchema, taskQuerySchema } from "@/app/lib/task-validation";
import { taskVisibilityWhere } from "@/app/lib/task-permissions";

function queryValue(params: URLSearchParams, key: string) {
  const value = params.get(key);
  return value ? value : undefined;
}

function parseDate(value: string | undefined) {
  return value ? new Date(`${value}T00:00:00.000Z`) : undefined;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return errorResponse("กรุณาเข้าสู่ระบบ", 401);
  }

  const params = new URL(request.url).searchParams;
  const query = taskQuerySchema.safeParse({
    q: queryValue(params, "q"),
    status: queryValue(params, "status"),
    priority: queryValue(params, "priority"),
    assigneeId: queryValue(params, "assigneeId"),
    dueFrom: queryValue(params, "dueFrom"),
    dueTo: queryValue(params, "dueTo"),
  });

  if (!query.success) {
    return validationError(query.error);
  }
  if (
    query.data.dueFrom &&
    query.data.dueTo &&
    query.data.dueFrom > query.data.dueTo
  ) {
    return errorResponse("วันเริ่มต้นต้องไม่อยู่หลังวันสิ้นสุด", 400);
  }

  const { q, status, priority, assigneeId, dueFrom, dueTo } = query.data;
  const tasks = await prisma.task.findMany({
    where: {
      ...taskVisibilityWhere(session.user),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(session.user.role === "ADMIN" && assigneeId ? { assigneeId } : {}),
      ...(dueFrom || dueTo
        ? {
            dueDate: {
              ...(dueFrom ? { gte: parseDate(dueFrom) } : {}),
              ...(dueTo
                ? {
                    lt: new Date(
                      new Date(`${dueTo}T00:00:00.000Z`).getTime() + 86_400_000,
                    ),
                  }
                : {}),
            },
          }
        : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return errorResponse("กรุณาเข้าสู่ระบบ", 401);
  }
  if (!isJsonRequest(request)) {
    return errorResponse("Content-Type ต้องเป็น application/json", 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("รูปแบบ JSON ไม่ถูกต้อง", 400);
  }
  const parsed = taskCreateSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error);
  }
  if (session.user.role !== "ADMIN" && parsed.data.assigneeId) {
    return errorResponse("เฉพาะผู้ดูแลระบบเท่านั้นที่กำหนดผู้รับผิดชอบได้", 403);
  }

  const assigneeId =
    session.user.role === "ADMIN"
      ? parsed.data.assigneeId ?? session.user.id
      : session.user.id;

  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { id: true },
  });
  if (!assignee) {
    return errorResponse("ไม่พบบัญชีผู้รับผิดชอบ", 400);
  }

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate
        ? new Date(`${parsed.data.dueDate}T00:00:00.000Z`)
        : null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      assigneeId,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
