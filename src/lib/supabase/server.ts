import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import * as dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

export function createClient() {
  const cookieStore = cookies();
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] as string | undefined;
  const anon = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string | undefined;
  if (!url || !anon) {
    const envPath = path.resolve(process.cwd(), ".env");
    let debug = "Missing Supabase SSR environment variables";
    try {
      const exists = fs.existsSync(envPath);
      debug += ` (.env exists: ${exists ? "yes" : "no"})`;
    } catch {}
    throw new Error(debug);
  }
  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        const c = cookieStore.get(name);
        return c?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {}
      },
      remove(name: string, options: any) {
        try {
          cookieStore.delete(name);
        } catch {}
      },
    },
  });
}
