"use client";

import { useState } from "react";
import { buildShareText } from "@/lib/share";
import { formatDuration } from "@/lib/format";
import { MAX_ATTEMPTS } from "@/lib/words";
import { tapHaptic } from "@/lib/haptics";
import type { GameState } from "@/lib/game";

export function ResultModal({
  state,
  onRestart,
}: {
  state: GameState;
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const won = state.status === "won";
  const dur =
    state.finishedAt != null
      ? formatDuration(state.finishedAt - state.startedAt)
      : "-";

  async function share() {
    tapHaptic();
    const url = window.location.href;
    // 링크를 본문에도 포함해 어떤 앱으로 공유하든 항상 링크가 보이게
    const text = `${buildShareText(state)}\n${url}`;

    // 모바일: OS 기본 공유 시트(카톡·메일·메시지 등). 취소는 정상 종료.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text, url });
      } catch {
        // 사용자 취소 등 — 무시
      }
      return;
    }

    // 미지원(데스크톱 등) → 클립보드 복사 폴백
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 무시
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-[#2c2c2e] p-6 pb-7 text-center shadow-2xl">
        <h2 className={`text-2xl font-bold ${won ? "text-correct" : "text-neutral-300"}`}>
          {won ? "🎉 정답!" : "아쉬워요"}
        </h2>
        <p className="mt-3 text-neutral-300">
          정답 <span className="text-xl font-bold text-white">{state.answer}</span>{" "}
          <span className="text-sm text-neutral-500">
            {state.answerJamo.join(" ")}
          </span>
        </p>
        <p className="mt-1 text-sm text-neutral-400">
          시도 {won ? state.guesses.length : "X"}/{MAX_ATTEMPTS} · ⏱ {dur}
        </p>

        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={share}
            className="flex-1 rounded-xl bg-correct py-3 font-semibold text-[#121213] active:opacity-80"
          >
            {copied ? "복사됨!" : "결과 공유"}
          </button>
          <button
            type="button"
            onClick={() => {
              tapHaptic();
              onRestart();
            }}
            className="flex-1 rounded-xl bg-[#48484a] py-3 font-semibold text-white active:opacity-80"
          >
            다시하기
          </button>
        </div>
      </div>
    </div>
  );
}
