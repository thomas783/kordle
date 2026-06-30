import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Supabase 환경변수가 설정돼 있는지 (미설정 시 로그인 UI 숨김) */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/** 브라우저용 Supabase 클라이언트. 미설정 시 null. */
export function createClient() {
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}
