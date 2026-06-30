import { describe, it, expect, vi } from "vitest";

// 사전 의존 격리: 사과/학교만 유효 단어로, 정답은 항상 사과
vi.mock("@/lib/words", () => ({
  MAX_ATTEMPTS: 5,
  ANSWER_LENGTH: 5,
  isValidGuessKey: (key: string) =>
    key === "ㅅㅏㄱㅗㅏ" || key === "ㅎㅏㄱㄱㅛ",
  getRandomAnswer: () => ({ syllable: "사과", jamo: "ㅅㅏㄱㅗㅏ" }),
}));

import {
  gameReducer,
  createNewGame,
  type GameState,
  type GuessRow,
} from "@/lib/game";

function playing(over: Partial<GameState> = {}): GameState {
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

describe("createNewGame", () => {
  it("정답 추첨 + 자모 분해 + 타이머 시작", () => {
    const s = createNewGame(123);
    expect(s.answer).toBe("사과");
    expect(s.answerJamo).toEqual(["ㅅ", "ㅏ", "ㄱ", "ㅗ", "ㅏ"]);
    expect(s.startedAt).toBe(123);
    expect(s.status).toBe("playing");
    expect(s.guesses).toEqual([]);
  });
});

describe("gameReducer", () => {
  it("input: 자모 추가, 5개 차면 더 안 늘어남", () => {
    let s = playing();
    for (const j of ["ㅅ", "ㅏ", "ㄱ", "ㅗ", "ㅏ"]) {
      s = gameReducer(s, { type: "input", jamo: j });
    }
    expect(s.current).toEqual(["ㅅ", "ㅏ", "ㄱ", "ㅗ", "ㅏ"]);
    const s2 = gameReducer(s, { type: "input", jamo: "ㄴ" });
    expect(s2.current).toHaveLength(5);
  });

  it("delete: 마지막 자모 제거", () => {
    const s = gameReducer(playing({ current: ["ㅅ", "ㅏ"] }), {
      type: "delete",
    });
    expect(s.current).toEqual(["ㅅ"]);
  });

  it("delete: 비어있으면 그대로", () => {
    const s = playing({ current: [] });
    expect(gameReducer(s, { type: "delete" })).toBe(s);
  });

  it("submit: 무효 단어 → invalidAt 세팅, 시도 차감 X, 입력 유지", () => {
    const s = gameReducer(playing({ current: ["ㄴ", "ㄴ", "ㄴ", "ㄴ", "ㄴ"] }), {
      type: "submit",
      now: 50,
    });
    expect(s.guesses).toHaveLength(0);
    expect(s.invalidAt).toBe(50);
    expect(s.current).toEqual(["ㄴ", "ㄴ", "ㄴ", "ㄴ", "ㄴ"]);
  });

  it("submit: 정답 → won, 전부 correct, finishedAt 기록", () => {
    const s = gameReducer(playing({ current: ["ㅅ", "ㅏ", "ㄱ", "ㅗ", "ㅏ"] }), {
      type: "submit",
      now: 100,
    });
    expect(s.status).toBe("won");
    expect(s.guesses).toHaveLength(1);
    expect(s.guesses[0].states.every((x) => x === "correct")).toBe(true);
    expect(s.finishedAt).toBe(100);
    expect(s.current).toEqual([]);
  });

  it("submit: 오답 5회 → lost", () => {
    const wrongRow: GuessRow = {
      jamo: ["ㅎ", "ㅏ", "ㄱ", "ㄱ", "ㅛ"],
      states: ["absent", "present", "absent", "absent", "absent"],
    };
    const s = gameReducer(
      playing({
        guesses: [wrongRow, wrongRow, wrongRow, wrongRow],
        current: ["ㅎ", "ㅏ", "ㄱ", "ㄱ", "ㅛ"],
      }),
      { type: "submit", now: 200 },
    );
    expect(s.status).toBe("lost");
    expect(s.guesses).toHaveLength(5);
    expect(s.finishedAt).toBe(200);
  });

  it("submit: 5자모 미만이면 무시", () => {
    const s = playing({ current: ["ㅅ", "ㅏ"] });
    expect(gameReducer(s, { type: "submit", now: 1 })).toBe(s);
  });

  it("게임 종료 후 input/delete/submit 무시", () => {
    const won = playing({ status: "won" });
    expect(gameReducer(won, { type: "input", jamo: "ㅅ" })).toBe(won);
    expect(gameReducer(won, { type: "delete" })).toBe(won);
    expect(gameReducer(won, { type: "submit", now: 1 })).toBe(won);
  });

  it("load: 상태 교체하되 invalidAt은 초기화", () => {
    const restored = playing({ invalidAt: 999, current: ["ㅅ"] });
    const s = gameReducer(playing(), { type: "load", state: restored });
    expect(s.invalidAt).toBeNull();
    expect(s.current).toEqual(["ㅅ"]);
    expect(s.answer).toBe("사과");
  });
});
