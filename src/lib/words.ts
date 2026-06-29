/**
 * 단어 사전 접근 (scripts/build-words.ts 산출물 로드)
 */
import data from "@/data/words.json";

export interface WordEntry {
  syllable: string; // "사과"
  jamo: string; // "ㅅㅏㄱㅗㅏ"
}

export const MAX_ATTEMPTS = 5;
export const ANSWER_LENGTH = 5;

const answers: WordEntry[] = data.answers;
const guessSet = new Set<string>(data.guesses);

// 테스트용: 탭 세션당 정답 1개로 고정 (true면 매판 같은 단어).
// 운영은 false → 매판 랜덤.
const FIX_ANSWER_PER_SESSION = false;
const SESSION_KEY = "kordle.debugAnswer";

/** 정답 풀에서 무작위 단어 1개 (테스트 시 세션 고정) */
export function getRandomAnswer(): WordEntry {
  const pickRandom = () => answers[Math.floor(Math.random() * answers.length)];

  if (FIX_ANSWER_PER_SESSION && typeof sessionStorage !== "undefined") {
    const cached = sessionStorage.getItem(SESSION_KEY);
    const found = cached ? answers.find((a) => a.syllable === cached) : undefined;
    if (found) return found;
    const pick = pickRandom();
    sessionStorage.setItem(SESSION_KEY, pick.syllable);
    return pick;
  }
  return pickRandom();
}

/** 입력 자모 시퀀스 키가 허용 단어인지 (O(1)) */
export function isValidGuessKey(jamoKey: string): boolean {
  return guessSet.has(jamoKey);
}
