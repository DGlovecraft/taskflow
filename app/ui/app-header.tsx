import Link from "next/link";
import { signOut } from "@/auth";
import type { Session } from "next-auth";

export default function AppHeader({ user }: { user: Session["user"] }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link href="/tasks" className="text-xl font-bold text-indigo-700">
          TaskFlow
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/tasks" className="font-medium hover:text-indigo-700">
            งานทั้งหมด
          </Link>
          <Link
            href="/tasks/new"
            className="rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-700"
          >
            + สร้างงาน
          </Link>
          <span className="text-slate-600">
            {user.name} ({user.role === "ADMIN" ? "ผู้ดูแล" : "สมาชิก"})
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="font-medium text-slate-600 hover:text-red-700"
            >
              ออกจากระบบ
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
