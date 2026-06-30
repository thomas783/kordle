import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveGame, loadGame, clearGame } from "@/lib/storage";
import type { GameState } from "@/lib/game";

// 인메모리 localStorage 목 (node 환경엔 없음)
const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

const sample: GameState = {
  answer: "사과",
  answerJamo: ["ㅅ", "ㅏ", "ㄱ", "ㅗ", "ㅏ"],
  guesses: [{ jamo: ["ㅅ", "ㅏ", "ㄱ", "ㅗ", "ㅏ"], states: ["correct", "correct", "correct", "correct", "correct"] }],
  current: [],
  status: "won",
  startedAt: 1,
  finishedAt: 100,
  invalidAt: null,
};

describe("storage", () => {
  it("save → load 라운드트립", () => {
    saveGame(sample);
    expect(loadGame()).toEqual(sample);
  });

  it("저장된 게 없으면 null", () => {
    expect(loadGame()).toBeNull();
  });

  it("clear 후 null", () => {
    saveGame(sample);
    clearGame();
    expect(loadGame()).toBeNull();
  });

  it("깨진 JSON이면 throw 없이 null", () => {
    store.set("kordle.current", "{not valid json");
    expect(loadGame()).toBeNull();
  });
});
