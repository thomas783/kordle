/**
 * 단어 사전 빌드 (스타터 버전)
 *
 * 검수된 후보 단어 목록을 받아:
 *   1) 자모 분해해서 정확히 5자모인 것만 통과
 *   2) 음절 중복 제거
 *   3) 자모 시퀀스 충돌(서로 다른 단어가 같은 자모5) 제거 → 정답 풀 (PRD D10)
 * 산출물: src/data/words.json = { answers: WordEntry[], guesses: string[] }
 *
 * ⚠️ v1.1 TODO: 후보 출처를 `klue/bert-base` vocab 필터링 결과로 교체 (PRD §2.5).
 *    지금은 "끝까지 플레이"를 위한 손수 검수 스타터 목록.
 *
 * 실행: npm run build:words
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { decomposeWord, jamoLength } from "../src/lib/hangul";

// 일상 명사 위주 후보. 5자모가 아닌 건 필터에서 자동 탈락한다.
const CANDIDATES: string[] = [
  // 2음절 (받침 1개 → 5자모 다수)
  "사과", "학교", "구름", "사람", "시간", "가방", "라면", "김밥", "우산",
  "부엌", "토끼", "단어", "가족", "친구", "거울", "공부", "노래", "바람",
  "농구", "수박", "양파", "김치", "소금", "마늘", "녹차", "사탕", "과자",
  "배우", "의사", "교실", "의자", "공원", "양말", "장갑", "안경", "시계",
  "달력", "가위", "지갑", "선물", "동물", "식물", "건물", "기분", "행복",
  "걱정", "사랑", "추억", "주말", "방학", "숙제", "점심", "저녁", "아침",
  "겨울", "여름", "가을", "봄날", "햇빛", "구멍", "거품", "이불", "베개",
  "수건", "비누", "치약", "냄비", "접시", "젓가", "도마", "주걱",
  // 1음절 (쌍자음/복모음/받침 조합으로 5자모)
  "꽉", "꿩", "쾅", "꿀", "꽃",
  // 3음절 (받침 거의 없는 단순 단어 → 5~6자모, 5만 통과)
  "아버지", "어머니", "바나나", "고구마", "보리차", "다리미", "도라지",
  "코끼리", "기러기", "오소리", "두더지", "메뚜기", "거머리", "지푸라기",
  // 노이즈(탈락 예상): 길이 검증 신뢰성 확인용
  "바다", "나무", "구두", "모자", "포도", "우유", "커피",
];

interface WordEntry {
  syllable: string; // 음절 형태 ("사과")
  jamo: string; // 자모 시퀀스 ("ㅅㅏㄱㅗㅏ")
}

function build() {
  // 1) 5자모 필터 + 음절 중복 제거
  const seenSyllable = new Set<string>();
  const fiveJamo: WordEntry[] = [];
  const dropped: string[] = [];

  for (const word of CANDIDATES) {
    if (jamoLength(word) !== 5) {
      dropped.push(`${word}(${jamoLength(word)})`);
      continue;
    }
    if (seenSyllable.has(word)) continue;
    seenSyllable.add(word);
    fiveJamo.push({ syllable: word, jamo: decomposeWord(word).join("") });
  }

  // 2) 자모 시퀀스 충돌 제거 → 정답 풀 (한 자모키당 첫 단어만)
  const byJamo = new Map<string, WordEntry>();
  const collisions: string[] = [];
  for (const entry of fiveJamo) {
    if (byJamo.has(entry.jamo)) {
      collisions.push(`${entry.syllable} ≡ ${byJamo.get(entry.jamo)!.syllable}`);
      continue;
    }
    byJamo.set(entry.jamo, entry);
  }

  const answers = [...byJamo.values()];
  // 입력 허용 풀: 일단 정답 풀의 자모키 전체 (v1.1에서 KLUE로 확장)
  const guesses = answers.map((e) => e.jamo);

  const out = { answers, guesses };

  const here = dirname(fileURLToPath(import.meta.url));
  const dataDir = join(here, "..", "src", "data");
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(
    join(dataDir, "words.json"),
    JSON.stringify(out, null, 2) + "\n",
    "utf8",
  );

  console.log(`✅ words.json 생성`);
  console.log(`   정답 풀: ${answers.length}개`);
  console.log(`   입력 허용: ${guesses.length}개`);
  if (collisions.length) console.log(`   충돌 제거: ${collisions.join(", ")}`);
  console.log(`   5자모 아님 탈락(${dropped.length}): ${dropped.join(", ")}`);
}

build();
