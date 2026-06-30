import { describe, it, expect } from "vitest";
import { formatDuration } from "@/lib/format";

describe("formatDuration", () => {
  it("ms → m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(5000)).toBe("0:05");
    expect(formatDuration(65000)).toBe("1:05");
    expect(formatDuration(600000)).toBe("10:00");
  });

  it("초 미만은 버림, 음수는 0", () => {
    expect(formatDuration(1999)).toBe("0:01");
    expect(formatDuration(-500)).toBe("0:00");
  });

  it("초 두 자리 패딩", () => {
    expect(formatDuration(9000)).toBe("0:09");
    expect(formatDuration(70000)).toBe("1:10");
  });
});
