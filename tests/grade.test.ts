import { describe, it, expect } from "vitest";
import {
  gradeJamo,
  gradeWord,
  isSolved,
  mergeKeyboardStates,
  type TileState,
} from "@/lib/grade";

const C: TileState = "correct";
const P: TileState = "present";
const A: TileState = "absent";

describe("gradeJamo — 기본", () => {
  it("완전 일치 → 전부 correct", () => {
    const a = ["ㅅ", "ㅏ", "ㄱ", "ㅗ", "ㅏ"];
    expect(gradeJamo(a, a)).toEqual([C, C, C, C, C]);
  });

  it("겹치는 자모 없음 → 전부 absent", () => {
    expect(
      gradeJamo(["ㄴ", "ㅓ", "ㄹ", "ㅜ", "ㅁ"], ["ㅅ", "ㅏ", "ㄱ", "ㅗ", "ㅣ"]),
    ).toEqual([A, A, A, A, A]);
  });

  it("자모는 맞고 위치 다름 → present", () => {
    // 정답 ㅅㅏㄱㅗㅏ, 추측 ㅏㅅ... → ㅏ,ㅅ는 present
    expect(
      gradeJamo(["ㅏ", "ㅅ", "ㅈ", "ㅊ", "ㅋ"], ["ㅅ", "ㅏ", "ㄱ", "ㅗ", "ㅏ"]),
    ).toEqual([P, P, A, A, A]);
  });
});

describe("gradeJamo — 중복 처리 (핵심)", () => {
  it("정답 ㅏ 2개, 추측 ㅏ 5개 → correct 2 + 나머지 absent", () => {
    const answer = ["ㅏ", "ㅏ", "ㅂ", "ㅅ", "ㄷ"];
    const guess = ["ㅏ", "ㅏ", "ㅏ", "ㅏ", "ㅏ"];
    expect(gradeJamo(guess, answer)).toEqual([C, C, A, A, A]);
  });

  it("present는 정답 재고만큼만 발급", () => {
    // 정답에 ㅏ 2개(위치1,4). 추측 ㅏ 3개(위치0,2,3 — 정답 ㅏ위치와 안 겹침)
    // → 재고 2개라 앞의 2개만 present, 3번째 ㅏ는 absent
    const answer = ["ㅅ", "ㅏ", "ㄱ", "ㅗ", "ㅏ"];
    const guess = ["ㅏ", "ㅈ", "ㅏ", "ㅏ", "ㄴ"];
    expect(gradeJamo(guess, answer)).toEqual([P, A, P, A, A]);
  });

  it("correct가 재고를 먼저 선점", () => {
    // 정답 ㅏ 1개(위치2). 추측 ㅏ 2개(위치0, 위치2)
    // 위치2가 correct로 재고 선점 → 위치0의 ㅏ는 absent
    const answer = ["ㅅ", "ㄱ", "ㅏ", "ㅗ", "ㄷ"];
    const guess = ["ㅏ", "ㄱ", "ㅏ", "ㅈ", "ㅈ"];
    expect(gradeJamo(guess, answer)).toEqual([A, C, C, A, A]);
  });
});

describe("gradeWord & isSolved", () => {
  it("음절 단어로 채점", () => {
    expect(gradeWord("사과", "사과")).toEqual([C, C, C, C, C]);
    expect(isSolved(gradeWord("사과", "사과"))).toBe(true);
  });

  it("틀리면 isSolved false", () => {
    expect(isSolved(gradeWord("학교", "사과"))).toBe(false);
  });
});

describe("mergeKeyboardStates — 자판 색상 누적 (D12)", () => {
  it("더 높은 등급으로만 갱신", () => {
    let kb: Record<string, TileState> = {};
    kb = mergeKeyboardStates(kb, ["ㅅ", "ㅏ"], [A, P]);
    expect(kb).toEqual({ ㅅ: A, ㅏ: P });

    // ㅏ가 다음 추측에서 correct → 승격
    kb = mergeKeyboardStates(kb, ["ㅏ"], [C]);
    expect(kb["ㅏ"]).toBe(C);
  });

  it("한 번 correct면 강등 안 됨", () => {
    let kb: Record<string, TileState> = { ㄱ: C };
    kb = mergeKeyboardStates(kb, ["ㄱ"], [A]);
    expect(kb["ㄱ"]).toBe(C);
  });
});
