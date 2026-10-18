import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SignupForm from "@/app/ui/signup-form";

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/tasks");
  }

  return (
    <main className="mx-auto mt-12 w-full max-w-md px-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/login" className="text-sm font-semibold text-indigo-700">
          ← กลับเข้าสู่ระบบ
        </Link>
        <h1 className="mt-4 text-3xl font-bold">สร้างบัญชี</h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">
          บัญชีใหม่จะเริ่มต้นด้วยสิทธิ์สมาชิก
        </p>
        <SignupForm />
      </section>
    </main>
  );
}
