import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** RSC/route handler용 Supabase 클라이언트. 미설정 시 null. */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component에서 호출되면 무시 (미들웨어가 세션 갱신 담당)
        }
      },
    },
  });
}
