"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { tapHaptic } from "@/lib/haptics";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // 미설정/로딩 중엔 아무것도 안 보임 (게임은 정상)
  if (!isSupabaseConfigured() || !ready) return null;

  async function login() {
    tapHaptic();
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function logout() {
    tapHaptic();
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={login}
        className="rounded-md bg-[#FEE500] px-2.5 py-1 text-xs font-bold text-[#191600] active:opacity-80"
      >
        카카오 로그인
      </button>
    );
  }

  const name =
    (user.user_metadata?.name as string) ??
    (user.user_metadata?.nickname as string) ??
    "사용자";
  const avatar =
    (user.user_metadata?.avatar_url as string) ??
    (user.user_metadata?.picture as string) ??
    null;

  return (
    <button
      type="button"
      onClick={logout}
      title="로그아웃"
      className="flex items-center gap-1.5 rounded-full bg-[#2c2c2e] py-1 pl-1 pr-2.5 active:opacity-80"
    >
      {avatar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
      )}
      <span className="max-w-20 truncate text-xs text-neutral-200">{name}</span>
    </button>
  );
}
