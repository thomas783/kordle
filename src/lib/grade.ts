/**
 * 채점 (grading) — 2-pass Wordle 규칙 (PRD D6)
 *
 * 자모 시퀀스 두 개(추측 vs 정답)를 위치별로 비교해 타일 상태를 매긴다.
 *
 *   🟩 correct : 자모 + 위치 모두 정답
 *   🟨 present : 자모는 정답에 있으나 위치가 다름 (정답에 남은 개수만큼만)
 *   ⬜ absent  : 정답에 없거나, 이미 다 소진된 자모
 *
 * 핵심은 "정답에 존재하는 개수"를 재고처럼 차감하는 것:
 *   1-pass) 위치까지 맞은 자모를 correct로 확정하고 재고에서 뺀다.
 *   2-pass) 남은 재고가 있으면 present, 없으면 absent.
 * → 정답에 ㅏ가 1개뿐이면 추측의 ㅏ는 최대 1개만 색칠된다.
 */

import { decomposeWord } from "./hangul";

export type TileState = "correct" | "present" | "absent";

/** 추측/정답 자모 시퀀스를 받아 위치별 타일 상태 배열을 반환 */
export function gradeJamo(guess: string[], answer: string[]): TileState[] {
  const n = answer.length;
  const result: TileState[] = new Array(n).fill("absent");

  // 정답 자모 재고 카운트
  const remaining = new Map<string, number>();
  for (const j of answer) {
    remaining.set(j, (remaining.get(j) ?? 0) + 1);
  }

  // 1-pass: 위치까지 정확한 것 먼저 확정 + 재고 차감
  for (let i = 0; i < n; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
      remaining.set(guess[i], remaining.get(guess[i])! - 1);
    }
  }

  // 2-pass: 남은 재고에서만 present 발급
  for (let i = 0; i < n; i++) {
    if (result[i] === "correct") continue;
    const left = remaining.get(guess[i]) ?? 0;
    if (left > 0) {
      result[i] = "present";
      remaining.set(guess[i], left - 1);
    }
  }

  return result;
}

/** 음절 단어 두 개를 받아 채점 (분해 후 gradeJamo) */
export function gradeWord(guess: string, answer: string): TileState[] {
  return gradeJamo(decomposeWord(guess), decomposeWord(answer));
}

/** 추측이 정답과 완전히 일치(전부 correct)하는지 */
export function isSolved(states: TileState[]): boolean {
  return states.every((s) => s === "correct");
}

// ───────────────────────────────────────────────────────────────
// 자판 색상 누적 (PRD D12): 한 자모가 여러 번 쓰이면 가장 좋은 상태 유지
// 우선순위 correct > present > absent
// ───────────────────────────────────────────────────────────────

const RANK: Record<TileState, number> = { correct: 2, present: 1, absent: 0 };

/**
 * 기존 자판 상태 맵에 이번 추측 결과를 병합한다 (더 높은 등급만 덮어씀).
 * @param prev   자모 → 현재까지의 최고 상태
 * @param guess  이번 추측 자모 시퀀스
 * @param states 이번 추측의 채점 결과
 * @returns 새 상태 맵 (불변)
 */
export function mergeKeyboardStates(
  prev: Record<string, TileState>,
  guess: string[],
  states: TileState[],
): Record<string, TileState> {
  const next = { ...prev };
  for (let i = 0; i < guess.length; i++) {
    const jamo = guess[i];
    const incoming = states[i];
    if (next[jamo] === undefined || RANK[incoming] > RANK[next[jamo]]) {
      next[jamo] = incoming;
    }
  }
  return next;
}
