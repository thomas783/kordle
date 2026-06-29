/**
 * 게임 단어 사전 빌드 (5자모) + 정제
 *
 * build:dict 산출물(words-by-jamo/5.json)에서 게임용 words.json을 만든다.
 *   - 입력 허용 풀(guesses): 5자모 전부의 자모 시퀀스 (넓게)
 *   - 정답 풀(answers): 사전 표제어(명사+고유명사)와 교집합해 정제.
 *       · KLUE vocab의 형태소 조각(미얀·옥수…)과 동사 활용형(잡혀·내려·고를)은
 *         표제어 사전에 없으므로 자연 탈락 → 명사·고유명사·비속어(명사형)만 남음.
 *       · 추가로 OpenSubtitles 빈도 사전과 교집합해 "흔한 단어" 위주로.
 *       · 자모 시퀀스 충돌(동일 자모5) 제거 (PRD D10).
 *
 * 출처:
 *   - 표제어: open-korean-text (nouns.txt, entities.txt)
 *   - 빈도:   hermitdave/FrequencyWords (ko_50k)
 *
 * 산출물: src/data/words.json = { answers: WordEntry[], guesses: string[] }
 * 실행: npm run build:words   (5.json은 npm run build:dict로 먼저 생성)
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

interface WordEntry {
  syllable: string;
  jamo: string;
}

const OKT_BASE =
  "https://raw.githubusercontent.com/open-korean-text/open-korean-text/master/src/main/resources/org/openkoreantext/processor/util/noun";
const DICT_SOURCES: [string, string][] = [
  ["okt-nouns", `${OKT_BASE}/nouns.txt`],
  ["okt-entities", `${OKT_BASE}/entities.txt`],
];
const FREQ_URL =
  "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ko/ko_50k.txt";

const here = dirname(fileURLToPath(import.meta.url));
const srcPath = join(here, "..", "src", "data", "words-by-jamo", "5.json");
const outPath = join(here, "..", "src", "data", "words.json");
const cacheDir = join(here, ".cache");

const HANGUL = /^[가-힣]+$/;

async function fetchCached(name: string, url: string): Promise<string> {
  const cache = join(cacheDir, `${name}.txt`);
  if (existsSync(cache)) return readFileSync(cache, "utf8");
  console.log(`⬇️  ${name} 다운로드...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name} 다운로드 실패: HTTP ${res.status}`);
  const text = await res.text();
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(cache, text, "utf8");
  return text;
}

async function getDictWords(): Promise<Set<string>> {
  const set = new Set<string>();
  for (const [name, url] of DICT_SOURCES) {
    const text = await fetchCached(name, url);
    for (const line of text.split("\n")) {
      const w = line.trim();
      if (HANGUL.test(w)) set.add(w);
    }
  }
  return set;
}

async function getFreqWords(): Promise<Set<string>> {
  const text = await fetchCached("ko-freq-50k", FREQ_URL);
  const set = new Set<string>();
  for (const line of text.split("\n")) {
    const word = line.trim().split(/\s+/)[0];
    if (word && HANGUL.test(word)) set.add(word);
  }
  return set;
}

async function build() {
  const all: WordEntry[] = JSON.parse(readFileSync(srcPath, "utf8"));
  const dict = await getDictWords();
  const freq = await getFreqWords();

  // 입력 허용 풀: 5자모 전부
  const guesses = [...new Set(all.map((e) => e.jamo))];

  // 정답 풀: 표제어(명사/고유명사) ∩ 빈도 ∩ 충돌 제거
  const byJamo = new Map<string, WordEntry>();
  for (const e of all) {
    if (!dict.has(e.syllable)) continue; // 동사 활용형·조각 제거
    if (!freq.has(e.syllable)) continue; // 흔한 단어 위주
    if (!byJamo.has(e.jamo)) byJamo.set(e.jamo, e);
  }
  const answers = [...byJamo.values()];

  writeFileSync(outPath, JSON.stringify({ answers, guesses }) + "\n", "utf8");
  console.log(`✅ words.json`);
  console.log(`   정답 풀: ${answers.length}개 (표제어 ∩ 빈도)`);
  console.log(`   입력 허용: ${guesses.length}개 (5자모 전부)`);
}

build();
