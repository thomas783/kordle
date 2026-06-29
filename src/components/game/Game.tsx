"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import confetti from "canvas-confetti";

// SSR 경고 없이 클라이언트에서만 layout effect (paint 전 실행)
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { gameReducer, createNewGame, type GameState } from "@/lib/game";
import { loadGame, saveGame, clearGame } from "@/lib/storage";
import { mergeKeyboardStates, type TileState } from "@/lib/grade";
import { Board, REVEAL_STAGGER_MS } from "./Board";
import { Keyboard } from "./Keyboard";
import { Timer } from "./Timer";
import { ResultModal } from "./ResultModal";

const REVEAL_DURATION_MS = 560; // CSS reveal-correct 애니메이션 길이와 일치

function burstConfetti() {
  // 모달 위(zIndex↑)에서 중앙 + 양쪽 대포 한 번
  confetti({ particleCount: 80, spread: 75, origin: { y: 0.6 }, zIndex: 200 });
  confetti({ particleCount: 30, angle: 60, spread: 55, origin: { x: 0 }, zIndex: 200 });
  confetti({ particleCount: 30, angle: 120, spread: 55, origin: { x: 1 }, zIndex: 200 });
}

export function Game() {
  // 초기값은 마운트 후 useEffect에서 채운다 (SSR/하이드레이션 불일치 회피)
  const [state, dispatch] = useReducer(
    gameReducer,
    null as unknown as GameState,
  );

  const [mounted, setMounted] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [toast, setToast] = useState(false);

  // 순차 공개 상태
  const [revealRow, setRevealRow] = useState(-1);
  const [showModal, setShowModal] = useState(false);
  const prevLenRef = useRef<number | null>(null);

  // 마운트 시: 진행 중 게임 복원 or 새 게임
  useEffect(() => {
    const restored = loadGame();
    dispatch({ type: "load", state: restored ?? createNewGame(Date.now()) });
    setMounted(true);
  }, []);

  // 상태 변경 시 진행 중 게임 저장 (resume용)
  useEffect(() => {
    if (mounted && state) saveGame(state);
  }, [mounted, state]);

  // 물리 키보드 보조: Enter 제출 / Backspace 삭제 (자모는 화면 자판으로만)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") dispatch({ type: "submit", now: Date.now() });
      else if (e.key === "Backspace") dispatch({ type: "delete" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 무효 제출 → 흔들림 + 토스트
  useEffect(() => {
    if (!state?.invalidAt) return;
    setShaking(true);
    setToast(true);
    const shakeId = setTimeout(() => setShaking(false), 450);
    const toastId = setTimeout(() => setToast(false), 3000);
    return () => {
      clearTimeout(shakeId);
      clearTimeout(toastId);
    };
  }, [state?.invalidAt]);

  // 제출(추측 추가) 시 최신 행을 좌→우 순차 공개, 완료 후 confetti/모달
  // paint 전에 revealRow를 잡아 "전부 초록 깜빡임" 방지 → layout effect
  useIsoLayoutEffect(() => {
    if (!state) return;
    const len = state.guesses.length;
    const prev = prevLenRef.current;

    // 최초 로드/복원: 애니메이션 없이 전부 공개
    if (prev === null) {
      prevLenRef.current = len;
      setRevealRow(-1);
      setShowModal(state.status !== "playing");
      return;
    }
    // 새 게임/리셋 (guesses 줄어듦)
    if (len < prev) {
      prevLenRef.current = len;
      setRevealRow(-1);
      setShowModal(false);
      return;
    }
    // 새 추측 제출 (guesses 늘어남) — 그 외(키 입력 등)는 no-op
    if (len > prev) {
      prevLenRef.current = len;

      // 정답일 때만 좌→우 순차 공개 (CSS animation-delay로 부드럽게)
      // 공개 시간만큼 기다렸다 모달 (confetti는 모달 위에서 반복: 아래 effect)
      if (state.status === "won") {
        setRevealRow(len - 1);
        const tiles = state.answerJamo.length;
        const total = (tiles - 1) * REVEAL_STAGGER_MS + REVEAL_DURATION_MS;
        const id = setTimeout(() => setShowModal(true), total);
        return () => clearTimeout(id);
      }

      // 오답: 즉시 전체 공개 (순차 X), 패배면 모달
      setRevealRow(-1);
      if (state.status === "lost") {
        const id = setTimeout(() => setShowModal(true), 400);
        return () => clearTimeout(id);
      }
    }
  }, [state]);

  // 승리 모달 위에서 빵빠레 반복 (모달 닫히면 정지)
  useEffect(() => {
    if (!showModal || state?.status !== "won") return;
    burstConfetti();
    const id = setInterval(burstConfetti, 2800);
    return () => clearInterval(id);
  }, [showModal, state?.status]);

  // 자판 색상 누적 (D12): 제출된 추측들을 병합
  const keyboardStates = useMemo(() => {
    let kb: Record<string, TileState> = {};
    if (state) {
      for (const row of state.guesses) {
        kb = mergeKeyboardStates(kb, row.jamo, row.states);
      }
    }
    return kb;
  }, [state]);

  if (!mounted || !state) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center text-neutral-500">
        로딩…
      </main>
    );
  }

  const ready = state.current.length === state.answerJamo.length;

  function restart() {
    clearGame();
    dispatch({ type: "load", state: createNewGame(Date.now()) });
  }

  return (
    <main className="mx-auto flex h-[100dvh] w-full max-w-md flex-col">
      <header className="relative px-4 pt-5 pb-2">
        <h1 className="text-center text-2xl font-bold tracking-tight">
          단어 맞히기
        </h1>
        <div className="absolute right-4 top-5">
          <Timer
            startedAt={state.startedAt}
            finishedAt={state.finishedAt}
            status={state.status}
          />
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center px-3">
        <Board state={state} shaking={shaking} revealRow={revealRow} />
      </section>

      <section className="relative flex flex-col gap-2.5 px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {toast && (
          <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-[#d3d6da] px-4 py-2 text-sm font-medium text-[#121213] shadow-lg">
            사전에 없는 단어입니다.
          </div>
        )}
        <Keyboard
          states={keyboardStates}
          onInput={(j) => dispatch({ type: "input", jamo: j })}
          onDelete={() => dispatch({ type: "delete" })}
        />
        <button
          type="button"
          disabled={!ready}
          onClick={() => dispatch({ type: "submit", now: Date.now() })}
          className={`mx-0.5 rounded-xl py-3.5 text-center text-base transition-colors ${
            ready
              ? "bg-present font-bold text-[#121213] active:opacity-90"
              : "bg-[#2c2c2e] font-semibold text-neutral-500"
          }`}
        >
          {ready ? "제출하기" : "글자를 입력하세요"}
        </button>
      </section>

      {showModal && <ResultModal state={state} onRestart={restart} />}
    </main>
  );
}
