import { describe, it, expect } from "vitest";
import { buildShareText } from "@/lib/share";
import type { GameState } from "@/lib/game";
import type { TileState } from "@/lib/grade";

const C: TileState = "correct";
const P: TileState = "present";
const A: TileState = "absent";

function state(over: Partial<GameState>): GameState {
  return {
    answer: "사과",
    answerJamo: ["ㅅ", "ㅏ", "ㄱ", "ㅗ", "ㅏ"],
    guesses: [],
    current: [],
    status: "playing",
    startedAt: 0,
    finishedAt: null,
    invalidAt: null,
    ...over,
  };
}

describe("buildShareText", () => {
  it("승리: 시도 수 + 소요 시간 + 이모지 그리드", () => {
    const text = buildShareText(
      state({
        status: "won",
        finishedAt: 9000,
        guesses: [
          { jamo: ["ㅎ", "ㅏ", "ㄱ", "ㄱ", "ㅛ"], states: [A, P, A, A, A] },
          { jamo: ["ㅅ", "ㅏ", "ㄱ", "ㅗ", "ㅏ"], states: [C, C, C, C, C] },
        ],
      }),
    );
    expect(text).toContain("kordle 2/5");
    expect(text).toContain("⏱ 0:09");
    expect(text).toContain("⬜🟨⬜⬜⬜");
    expect(text).toContain("🟩🟩🟩🟩🟩");
  });

  it("패배: 시도 수는 X", () => {
    const text = buildShareText(
      state({
        status: "lost",
        finishedAt: 5000,
        guesses: [{ jamo: ["ㅅ", "ㅏ", "ㄱ", "ㅗ", "ㅏ"], states: [A, A, A, A, A] }],
      }),
    );
    expect(text).toContain("kordle X/5");
    expect(text).toContain("⬜⬜⬜⬜⬜");
  });
});
