/** 결과 공유 텍스트 (🟩🟨⬜ 그리드 + 시도/시간) */
import { MAX_ATTEMPTS } from "./words";
import { formatDuration } from "./format";
import type { GameState } from "./game";
import type { TileState } from "./grade";

const EMOJI: Record<TileState, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬜",
};

export function buildShareText(state: GameState): string {
  const attempts = state.status === "won" ? `${state.guesses.length}` : "X";
  const dur =
    state.finishedAt != null
      ? ` ⏱ ${formatDuration(state.finishedAt - state.startedAt)}`
      : "";
  const grid = state.guesses
    .map((row) => row.states.map((s) => EMOJI[s]).join(""))
    .join("\n");
  return `kordle ${attempts}/${MAX_ATTEMPTS}${dur}\n\n${grid}`;
}
