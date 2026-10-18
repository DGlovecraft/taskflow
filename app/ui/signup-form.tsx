"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { signUp, type SignupState } from "@/app/signup/actions";

export default function SignupForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<SignupState, FormData>(
    signUp,
    {},
  );

  useEffect(() => {
    if (state.success) {
      router.replace("/login?registered=1");
    }
  }, [state.success, router]);

  return (
    <div>
      <form action={formAction} className="space-y-4">
        <label className="block text-sm font-medium">
          ชื่อ
          <input
            name="name"
            autoComplete="name"
            required
            maxLength={80}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5"
          />
        </label>
        <label className="block text-sm font-medium">
          อีเมล
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5"
          />
        </label>
        <label className="block text-sm font-medium">
          รหัสผ่าน
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5"
          />
        </label>
        <label className="block text-sm font-medium">
          ยืนยันรหัสผ่าน
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5"
          />
        </label>
        {state.error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        มีบัญชีแล้ว?{" "}
        <Link className="font-medium text-indigo-700 hover:underline" href="/login">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
