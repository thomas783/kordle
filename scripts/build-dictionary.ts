/**
 * 자모 개수별 단어 사전 빌드
 *
 * klue/bert-base 토크나이저 vocab을 받아 순수 한글 단어만 추리고,
 * 자모 분해 개수별로 버킷팅해 별도 파일로 저장한다. (난이도용 — 자모 많을수록 어려움)
 *
 * 산출물:
 *   src/data/words-by-jamo/5.json, 6.json, 7.json, ...  (각 [{syllable, jamo}])
 *   src/data/words-by-jamo/index.json                    (자모수 → 단어수 요약)
 *
 * ⚠️ vocab은 사전이 아니라 WordPiece 조각 모음이라 조사·접사·파편이 섞인다.
 *    "싹 다 수집"이 목적이고, 정답 풀 정제는 이후 단계.
 *
 * 실행: npm run build:dict   (원본 vocab은 scripts/.cache에 캐시)
 */

import {
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { decomposeWord } from "../src/lib/hangul";

const VOCAB_URL =
  "https://huggingface.co/klue/bert-base/resolve/main/vocab.txt";

const here = dirname(fileURLToPath(import.meta.url));
const cacheDir = join(here, ".cache");
const cachePath = join(cacheDir, "klue-vocab.txt");
const outDir = join(here, "..", "src", "data", "words-by-jamo");

// 순수 한글 단어 (완성형 음절만). ##subword·특수토큰·영문/한자/숫자 자동 탈락.
const HANGUL_WORD = /^[가-힣]+$/;

interface WordEntry {
  syllable: string;
  jamo: string;
}

async function getVocab(): Promise<string[]> {
  if (existsSync(cachePath)) {
    return readFileSync(cachePath, "utf8").split("\n");
  }
  console.log("⬇️  KLUE vocab 다운로드...");
  const res = await fetch(VOCAB_URL);
  if (!res.ok) throw new Error(`vocab 다운로드 실패: HTTP ${res.status}`);
  const text = await res.text();
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(cachePath, text, "utf8");
  return text.split("\n");
}

async function build() {
  const vocab = await getVocab();
  const words = vocab.map((t) => t.trim()).filter((t) => HANGUL_WORD.test(t));

  // 자모 개수별 버킷 (음절 중복 제거)
  const buckets = new Map<number, Map<string, WordEntry>>();
  for (const w of words) {
    const jamo = decomposeWord(w);
    const n = jamo.length;
    if (n === 0) continue;
    if (!buckets.has(n)) buckets.set(n, new Map());
    const bucket = buckets.get(n)!;
    if (!bucket.has(w)) bucket.set(w, { syllable: w, jamo: jamo.join("") });
  }

  mkdirSync(outDir, { recursive: true });
  const summary: Record<number, number> = {};
  for (const [n, bucket] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
    const entries = [...bucket.values()];
    writeFileSync(join(outDir, `${n}.json`), JSON.stringify(entries) + "\n", "utf8");
    summary[n] = entries.length;
  }
  writeFileSync(
    join(outDir, "index.json"),
    JSON.stringify(summary, null, 2) + "\n",
    "utf8",
  );

  console.log(`✅ 자모 개수별 사전 → ${outDir}`);
  console.log(`   한글 단어 ${words.length}개 (vocab ${vocab.length} 중)`);
  for (const [n, c] of Object.entries(summary)) {
    console.log(`   ${n}자모: ${c}개`);
  }
}

build();
