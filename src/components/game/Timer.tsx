"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/format";
import type { GameStatus } from "@/lib/game";

export function Timer({
  startedAt,
  finishedAt,
  status,
}: {
  startedAt: number;
  finishedAt: number | null;
  status: GameStatus;
}) {
  const [now, setNow] = useState(startedAt);

  useEffect(() => {
    if (status !== "playing") return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status, startedAt]);

  const end = finishedAt ?? (status === "playing" ? now : startedAt);
  return (
    <div className="font-mono text-sm tabular-nums text-neutral-500">
      ⏱ {formatDuration(end - startedAt)}
    </div>
  );
}
