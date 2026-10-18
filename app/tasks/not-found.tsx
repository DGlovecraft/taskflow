import Link from "next/link";

export default function TaskNotFound() {
  return (
    <main className="mx-auto mt-16 max-w-xl px-5 text-center">
      <h1 className="text-2xl font-bold">ไม่พบงานนี้</h1>
      <p className="mt-2 text-slate-600">งานอาจถูกลบ หรือคุณไม่มีสิทธิ์เข้าถึง</p>
      <Link href="/tasks" className="mt-5 inline-block text-indigo-700 underline">
        กลับไปหน้ารายการงาน
      </Link>
    </main>
  );
}
