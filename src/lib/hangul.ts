/**
 * 한글 자모 분해 (decomposition)
 *
 * 완성형 음절(가~힣)을 유니코드 공식으로 초/중/종성으로 가른 뒤,
 * jamo-mapping.ts의 테이블로 "키보드 24자모"까지 한 단계 더 분해한다.
 *
 *   음절코드 - 0xAC00 = (초성 × 21 + 중성) × 28 + 종성
 *
 * 게임의 모든 채점은 이 함수가 내놓는 자모 시퀀스 위에서 이뤄지므로,
 * 여기가 정확성의 단일 진실 공급원(SSOT)이다.
 */

import {
  DOUBLE_CONSONANT_MAP,
  COMPOUND_VOWEL_MAP,
  COMPOUND_FINAL_MAP,
  KEYBOARD_CONSONANTS,
  KEYBOARD_VOWELS,
  type KeyboardJamo,
} from "./jamo-mapping";

const HANGUL_BASE = 0xac00; // '가'
const HANGUL_LAST = 0xd7a3; // '힣'

// 유니코드 표준 초/중/종성 순서표
// prettier-ignore
const CHOSEONG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

// prettier-ignore
const JUNGSEONG = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ",
  "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
];

// index 0 = 받침 없음
// prettier-ignore
const JONGSEONG = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ",
  "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ",
  "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

const KEYBOARD_SET = new Set<string>([
  ...KEYBOARD_CONSONANTS,
  ...KEYBOARD_VOWELS,
]);

/**
 * 표준 자모 하나를 키보드 자모 배열로 환원한다.
 * - 이미 키보드 자모면 그대로 [자모]
 * - 쌍자음/복모음/겹받침이면 매핑 테이블로 풀어 1~3개로
 */
function reduceJamo(jamo: string): KeyboardJamo[] {
  if (KEYBOARD_SET.has(jamo)) return [jamo as KeyboardJamo];
  return (
    DOUBLE_CONSONANT_MAP[jamo] ??
    COMPOUND_VOWEL_MAP[jamo] ??
    COMPOUND_FINAL_MAP[jamo] ??
    // 알 수 없는 문자는 분해 불가 → 빈 배열 (게임 단어엔 등장하지 않아야 함)
    []
  );
}

/** 완성형 음절 한 글자를 키보드 자모 배열로 분해 */
export function decomposeSyllable(syllable: string): KeyboardJamo[] {
  const code = syllable.codePointAt(0);
  if (code === undefined || code < HANGUL_BASE || code > HANGUL_LAST) {
    return []; // 한글 음절이 아님
  }
  const offset = code - HANGUL_BASE;
  const choIdx = Math.floor(offset / 588);
  const jungIdx = Math.floor((offset % 588) / 28);
  const jongIdx = offset % 28;

  const result: KeyboardJamo[] = [
    ...reduceJamo(CHOSEONG[choIdx]),
    ...reduceJamo(JUNGSEONG[jungIdx]),
  ];
  if (jongIdx > 0) {
    result.push(...reduceJamo(JONGSEONG[jongIdx]));
  }
  return result;
}

/**
 * 단어(여러 음절)를 키보드 자모 시퀀스로 분해한다.
 * 예) "꽉"   → ["ㄱ","ㄱ","ㅗ","ㅏ","ㄱ"]
 *     "사과" → ["ㅅ","ㅏ","ㄱ","ㅗ","ㅏ"]
 */
export function decomposeWord(word: string): KeyboardJamo[] {
  const jamo: KeyboardJamo[] = [];
  for (const ch of word) {
    jamo.push(...decomposeSyllable(ch));
  }
  return jamo;
}

/** 자모 시퀀스 길이 (게임의 "n자모" 판정용) */
export function jamoLength(word: string): number {
  return decomposeWord(word).length;
}

/** 자모 시퀀스를 비교용 문자열 키로 (사전 Set 조회 등) */
export function jamoKey(word: string): string {
  return decomposeWord(word).join("");
}
