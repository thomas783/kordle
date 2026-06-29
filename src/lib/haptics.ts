/**
 * 약한 탭 진동 (Web Vibration API)
 *
 * Android Chrome 등은 지원. iOS Safari는 Vibration API 미지원이라 no-op.
 * 미지원 환경에서도 안전하게 동작하도록 가드한다.
 */
export function tapHaptic(ms = 10): void {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    navigator.vibrate(ms);
  }
}

/** 무효 입력 등 에러용 — 조금 더 강한 더블 버즈 (40ms-쉼-40ms) */
export function errorHaptic(): void {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    navigator.vibrate([40, 25, 40]);
  }
}
