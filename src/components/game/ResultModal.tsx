"use client";

import { useState } from "react";
import { buildShareText } from "@/lib/share";
import { formatDuration } from "@/lib/format";
import { MAX_ATTEMPTS } from "@/lib/words";
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
    try {
      await navigator.clipboard.writeText(buildShareText(state));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 불가 — 조용히 무시
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
            onClick={onRestart}
            className="flex-1 rounded-xl bg-[#48484a] py-3 font-semibold text-white active:opacity-80"
          >
            다시하기
          </button>
        </div>
      </div>
    </div>
  );
}
