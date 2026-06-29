/**
 * 진행 중 게임 상태만 localStorage에 저장 (PRD: resume).
 * 통계(plays 누적)는 v1 범위 밖 — 별도 키로 분리해 나중에 안 꼬이게.
 */
import type { GameState } from "./game";

const CURRENT_KEY = "kordle.current";

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(state));
  } catch {
    // localStorage 불가(프라이빗 모드 등) — 저장 실패는 무시, 게임은 계속
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    return raw ? (JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(CURRENT_KEY);
  } catch {
    // 무시
  }
}
