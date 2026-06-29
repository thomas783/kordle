import { Tile } from "./Tile";
import { MAX_ATTEMPTS } from "@/lib/words";
import type { GameState } from "@/lib/game";

// 정답 순차 공개: 타일별 지연(ms). duration(0.56s)보다 작아 물결처럼 겹침.
export const REVEAL_STAGGER_MS = 230;

export function Board({
  state,
  shaking,
  revealRow,
}: {
  state: GameState;
  shaking: boolean;
  revealRow: number; // 순차 공개 중인 행 (-1이면 없음 = 즉시 표시)
}) {
  const len = state.answerJamo.length;
  const currentRow = state.guesses.length;

  return (
    <div className="mx-auto flex w-full max-w-[20rem] flex-col gap-2">
      {Array.from({ length: MAX_ATTEMPTS }, (_, i) => {
        const isCurrent = i === currentRow && state.status === "playing";
        const isRevealing = i === revealRow;
        return (
          <div
            key={i}
            className={`flex gap-2 ${isCurrent && shaking ? "animate-shake" : ""}`}
          >
            {Array.from({ length: len }, (_, c) => {
              if (i < state.guesses.length) {
                const g = state.guesses[i];
                return (
                  <Tile
                    key={c}
                    jamo={g.jamo[c]}
                    state={g.states[c]}
                    revealing={isRevealing}
                    delayMs={c * REVEAL_STAGGER_MS}
                  />
                );
              }
              if (isCurrent) {
                const jamo = state.current[c];
                return <Tile key={c} jamo={jamo} filled={Boolean(jamo)} />;
              }
              return <Tile key={c} />;
            })}
          </div>
        );
      })}
    </div>
  );
}
