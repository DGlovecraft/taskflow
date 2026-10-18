import { z } from "zod";

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "วันครบกำหนดต้องอยู่ในรูปแบบ YYYY-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "วันครบกำหนดไม่ถูกต้อง");

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "กรุณากรอกชื่องาน").max(120, "ชื่องานต้องไม่เกิน 120 ตัวอักษร"),
  description: z.string().trim().max(5000, "รายละเอียดต้องไม่เกิน 5000 ตัวอักษร").default(""),
  dueDate: dateOnlySchema.nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  assigneeId: z.string().trim().min(1).optional(),
});

export const taskUpdateSchema = taskCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "ต้องส่งข้อมูลอย่างน้อยหนึ่งช่อง");

export const taskQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assigneeId: z.string().trim().min(1).optional(),
  dueFrom: dateOnlySchema.optional(),
  dueTo: dateOnlySchema.optional(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
