import { describe, it, expect } from "vitest";
import { getRandomAnswer, isValidGuessKey } from "@/lib/words";
import { decomposeWord, jamoLength } from "@/lib/hangul";

describe("words 사전 (실제 words.json)", () => {
  it("getRandomAnswer는 정확히 5자모 단어를 반환", () => {
    for (let i = 0; i < 30; i++) {
      const w = getRandomAnswer();
      expect(jamoLength(w.syllable)).toBe(5);
      expect(w.jamo).toBe(decomposeWord(w.syllable).join(""));
    }
  });

  it("정답은 입력 허용 풀에 포함 (answers ⊂ guesses)", () => {
    for (let i = 0; i < 30; i++) {
      expect(isValidGuessKey(getRandomAnswer().jamo)).toBe(true);
    }
  });

  it("사전에 없는 자모 시퀀스는 거부", () => {
    expect(isValidGuessKey("ㅋㅋㅋㅋㅋ")).toBe(false);
    expect(isValidGuessKey("")).toBe(false);
    expect(isValidGuessKey("ㅎㅎ")).toBe(false);
  });
});
