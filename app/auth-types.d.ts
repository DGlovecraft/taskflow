import type { DefaultSession } from "next-auth";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: "MEMBER" | "ADMIN";
  }

  interface Session {
    user: {
      id: string;
      role: "MEMBER" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "MEMBER" | "ADMIN";
  }
}
