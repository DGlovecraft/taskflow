"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/app/lib/prisma";

export type SignupState = {
  error?: string;
  success?: boolean;
};

const signupSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(80, "ชื่อต้องไม่เกิน 80 ตัวอักษร"),
  email: z.email("รูปแบบอีเมลไม่ถูกต้อง").transform((email) => email.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .max(128)
    .refine(
      (password) => new TextEncoder().encode(password).length <= 72,
      "รหัสผ่านต้องไม่เกิน 72 ไบต์",
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "รหัสผ่านไม่ตรงกัน",
});

export async function signUp(
  _previousState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const result = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "ข้อมูลสมัครสมาชิกไม่ถูกต้อง" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: result.data.email },
    select: { id: true },
  });

  if (existingUser) {
    return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
  }

  try {
    const passwordHash = await bcrypt.hash(result.data.password, 12);
    await prisma.user.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        passwordHash,
        role: "MEMBER",
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
    }
    throw error;
  }

  revalidatePath("/login");
  return { success: true };
}
