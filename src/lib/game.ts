/**
 * 게임 상태 머신 (순수 reducer)
 *
 * 시간/랜덤 같은 부수효과는 reducer 밖에서 처리하고(action으로 now 전달,
 * createNewGame이 정답 추첨), reducer는 입력 → 다음 상태 매핑만 담당한다.
 * → React 19 strict mode의 reducer 이중 호출에도 안전.
 */
import { decomposeWord } from "./hangul";
import { gradeJamo, isSolved, type TileState } from "./grade";
import { getRandomAnswer, isValidGuessKey, MAX_ATTEMPTS } from "./words";

export interface GuessRow {
  jamo: string[];
  states: TileState[];
}

export type GameStatus = "playing" | "won" | "lost";

export interface GameState {
  answer: string; // 정답 음절 ("사과")
  answerJamo: string[]; // 정답 자모 시퀀스
  guesses: GuessRow[]; // 제출된 추측들
  current: string[]; // 현재 입력 중인 자모
  status: GameStatus;
  startedAt: number; // 타이머 시작 (ms)
  finishedAt: number | null; // 종료 시각 (ms)
  invalidAt: number | null; // 무효 제출 시각 (흔들림 트리거)
}

/** 새 게임 (정답 추첨 + 타이머 시작) — 부수효과 포함, reducer 밖에서 호출 */
export function createNewGame(now: number): GameState {
  const w = getRandomAnswer();
  return {
    answer: w.syllable,
    answerJamo: decomposeWord(w.syllable),
    guesses: [],
    current: [],
    status: "playing",
    startedAt: now,
    finishedAt: null,
    invalidAt: null,
  };
}

export type GameAction =
  | { type: "input"; jamo: string }
  | { type: "delete" }
  | { type: "submit"; now: number }
  | { type: "load"; state: GameState };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "load":
      return action.state;

    case "input": {
      if (state.status !== "playing") return state;
      if (state.current.length >= state.answerJamo.length) return state;
      return { ...state, current: [...state.current, action.jamo], invalidAt: null };
    }

    case "delete": {
      if (state.status !== "playing" || state.current.length === 0) return state;
      return { ...state, current: state.current.slice(0, -1), invalidAt: null };
    }

    case "submit": {
      if (state.status !== "playing") return state;
      if (state.current.length !== state.answerJamo.length) return state;

      // 입력 허용 풀에 없으면 시도 차감 없이 흔들림만 (PRD §5.3)
      if (!isValidGuessKey(state.current.join(""))) {
        return { ...state, invalidAt: action.now };
      }

      const states = gradeJamo(state.current, state.answerJamo);
      const guesses = [...state.guesses, { jamo: state.current, states }];
      const won = isSolved(states);
      const lost = !won && guesses.length >= MAX_ATTEMPTS;

      return {
        ...state,
        guesses,
        current: [],
        status: won ? "won" : lost ? "lost" : "playing",
        finishedAt: won || lost ? action.now : null,
        invalidAt: null,
      };
    }

    default:
      return state;
  }
}
