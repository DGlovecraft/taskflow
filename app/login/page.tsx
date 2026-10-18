import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "@/app/ui/login-form";

type LoginPageProps = {
  searchParams: Promise<{ registered?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user) {
    redirect("/tasks");
  }

  const { registered } = await searchParams;
  return (
    <main className="mx-auto mt-16 w-full max-w-md px-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-indigo-700">
          TaskFlow
        </Link>
        <h1 className="mt-4 text-3xl font-bold">เข้าสู่ระบบ</h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">
          เข้าสู่ระบบเพื่อจัดการและติดตามงานของคุณ
        </p>
        {registered === "1" && (
          <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ
          </p>
        )}
        <LoginForm />
        <p className="mt-6 text-center text-sm text-slate-600">
          ยังไม่มีบัญชี?{" "}
          <Link href="/signup" className="font-semibold text-indigo-700 hover:underline">
            สมัครสมาชิก
          </Link>
        </p>
      </section>
    </main>
  );
}
