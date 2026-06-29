import type { TileState } from "@/lib/grade";

// 채점된 타일은 밝은 배경 + 진한 글자 (레퍼런스)
const STATE_CLASS: Record<TileState, string> = {
  correct: "bg-correct border-correct text-[#121213]",
  present: "bg-present border-present text-[#121213]",
  absent: "bg-absent border-absent text-[#121213]",
};

const BASE =
  "flex aspect-square flex-1 items-center justify-center rounded-2xl border-2 text-3xl font-bold";

export function Tile({
  jamo,
  state,
  filled,
  revealing,
  delayMs,
}: {
  jamo?: string;
  state?: TileState;
  filled?: boolean;
  revealing?: boolean; // 정답 순차 공개 애니메이션 적용
  delayMs?: number; // 좌→우 stagger 지연
}) {
  if (state) {
    return (
      <div
        className={`${BASE} ${STATE_CLASS[state]} ${revealing ? "animate-reveal" : ""}`}
        style={revealing ? { animationDelay: `${delayMs ?? 0}ms` } : undefined}
      >
        {jamo}
      </div>
    );
  }
  const cls = filled
    ? "border-white text-white animate-pop" // 입력 중: 흰 테두리
    : "border-[#48484a] text-white"; // 빈 칸
  return <div className={`${BASE} ${cls}`}>{jamo ?? ""}</div>;
}
