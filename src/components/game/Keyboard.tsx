import type { TileState } from "@/lib/grade";
import { tapHaptic } from "@/lib/haptics";

const STATE_CLASS: Record<TileState, string> = {
  correct: "bg-correct text-[#121213]",
  present: "bg-present text-[#121213]",
  absent: "bg-absent text-[#121213]",
};

// 표준 두벌식 배열에서 쌍자음·ㅐ/ㅔ를 뺀 단일 자모 키보드 (PRD D5)
// 자음 14 + 모음 10 = 24, 폰 키보드 위치 그대로
const ROWS: string[][] = [
  ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ"],
  ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
  ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
];

interface Props {
  states: Record<string, TileState>;
  onInput: (jamo: string) => void;
  onDelete: () => void;
}

function Key({
  label,
  onClick,
  state,
}: {
  label: string;
  onClick: () => void;
  state?: TileState;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        tapHaptic();
        onClick();
      }}
      className={`flex h-11 shrink-0 grow-0 basis-[calc((100%-3rem)/9)] items-center justify-center rounded-md text-xl font-medium transition-colors ${
        state ? STATE_CLASS[state] : "bg-[#141416] text-white active:bg-[#242428]"
      }`}
    >
      {label}
    </button>
  );
}

export function Keyboard({ states, onInput, onDelete }: Props) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex justify-center gap-1.5">
        {ROWS[0].map((j) => (
          <Key key={j} label={j} state={states[j]} onClick={() => onInput(j)} />
        ))}
        <Key label="←" onClick={onDelete} />
      </div>
      <div className="flex justify-center gap-1.5">
        {ROWS[1].map((j) => (
          <Key key={j} label={j} state={states[j]} onClick={() => onInput(j)} />
        ))}
      </div>
      <div className="flex justify-center gap-1.5">
        {ROWS[2].map((j) => (
          <Key key={j} label={j} state={states[j]} onClick={() => onInput(j)} />
        ))}
      </div>
    </div>
  );
}
