import { describe, it, expect, vi, afterEach } from "vitest";
import { tapHaptic, errorHaptic } from "@/lib/haptics";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("haptics", () => {
  it("vibrate 지원 시 호출 (탭 10ms / 에러 더블 버즈)", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    tapHaptic();
    expect(vibrate).toHaveBeenCalledWith(10);
    errorHaptic();
    expect(vibrate).toHaveBeenCalledWith([40, 25, 40]);
  });

  it("vibrate 미지원이면 throw 안 함", () => {
    vi.stubGlobal("navigator", {});
    expect(() => tapHaptic()).not.toThrow();
    expect(() => errorHaptic()).not.toThrow();
  });
});
