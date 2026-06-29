import { describe, it, expect } from "vitest";
import {
  decomposeSyllable,
  decomposeWord,
  jamoLength,
  jamoKey,
} from "@/lib/hangul";

describe("decomposeSyllable", () => {
  it("받침 없는 단순 음절", () => {
    expect(decomposeSyllable("사")).toEqual(["ㅅ", "ㅏ"]);
    expect(decomposeSyllable("가")).toEqual(["ㄱ", "ㅏ"]);
  });

  it("받침 있는 음절", () => {
    expect(decomposeSyllable("강")).toEqual(["ㄱ", "ㅏ", "ㅇ"]);
    expect(decomposeSyllable("학")).toEqual(["ㅎ", "ㅏ", "ㄱ"]);
  });

  it("쌍자음 초성 → 단자음 2개", () => {
    expect(decomposeSyllable("까")).toEqual(["ㄱ", "ㄱ", "ㅏ"]);
    expect(decomposeSyllable("싸")).toEqual(["ㅅ", "ㅅ", "ㅏ"]);
  });

  it("복모음 → 단모음 조합", () => {
    expect(decomposeSyllable("과")).toEqual(["ㄱ", "ㅗ", "ㅏ"]); // ㅘ → ㅗㅏ
    expect(decomposeSyllable("워")).toEqual(["ㅇ", "ㅜ", "ㅓ"]); // ㅝ → ㅜㅓ
  });

  it("ㅐ/ㅔ 계열 분해 (D8)", () => {
    expect(decomposeSyllable("새")).toEqual(["ㅅ", "ㅏ", "ㅣ"]); // ㅐ → ㅏㅣ
    expect(decomposeSyllable("게")).toEqual(["ㄱ", "ㅓ", "ㅣ"]); // ㅔ → ㅓㅣ
    expect(decomposeSyllable("의")).toEqual(["ㅇ", "ㅡ", "ㅣ"]); // ㅢ → ㅡㅣ
  });

  it("ㅙ/ㅞ → 3자모", () => {
    expect(decomposeSyllable("왜")).toEqual(["ㅇ", "ㅗ", "ㅏ", "ㅣ"]); // ㅙ
  });

  it("겹받침 → 자음 2개", () => {
    expect(decomposeSyllable("값")).toEqual(["ㄱ", "ㅏ", "ㅂ", "ㅅ"]); // ㅄ
    expect(decomposeSyllable("닭")).toEqual(["ㄷ", "ㅏ", "ㄹ", "ㄱ"]); // ㄺ
  });

  it("쌍받침 ㄲ/ㅆ", () => {
    expect(decomposeSyllable("밖")).toEqual(["ㅂ", "ㅏ", "ㄱ", "ㄱ"]); // 종성 ㄲ
    expect(decomposeSyllable("있")).toEqual(["ㅇ", "ㅣ", "ㅅ", "ㅅ"]); // 종성 ㅆ
  });

  it("한글이 아니면 빈 배열", () => {
    expect(decomposeSyllable("a")).toEqual([]);
    expect(decomposeSyllable("1")).toEqual([]);
  });
});

describe("decomposeWord & 5자모 판정", () => {
  it("PRD 예시: 꽉 = 5자모", () => {
    expect(decomposeWord("꽉")).toEqual(["ㄱ", "ㄱ", "ㅗ", "ㅏ", "ㄱ"]);
    expect(jamoLength("꽉")).toBe(5);
  });

  it("PRD 예시: 사과 = 5자모", () => {
    expect(decomposeWord("사과")).toEqual(["ㅅ", "ㅏ", "ㄱ", "ㅗ", "ㅏ"]);
    expect(jamoLength("사과")).toBe(5);
  });

  it("다양한 단어 자모 수", () => {
    expect(jamoLength("학교")).toBe(5); // ㅎㅏㄱ + ㄱㅛ
    expect(jamoLength("바다")).toBe(4); // ㅂㅏ + ㄷㅏ
    expect(jamoLength("구름")).toBe(5); // ㄱㅜ + ㄹㅡㅁ
  });
});

describe("jamoKey", () => {
  it("자모 시퀀스를 문자열로 직렬화", () => {
    expect(jamoKey("사과")).toBe("ㅅㅏㄱㅗㅏ");
    expect(jamoKey("꽉")).toBe("ㄱㄱㅗㅏㄱ");
  });
});
