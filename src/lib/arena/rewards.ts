import type { ArenaDifficulty } from "@/lib/arena/cpu";

const ARENA_WIN_REWARD: Record<ArenaDifficulty, number> = {
  normal: 5,
  hard: 10,
};

const ARENA_DAILY_REWARDED_WINS = 4;

const ARENA_MIN_MATCH_SECONDS = 15;

const ARENA_TIME_ZONE = "America/Sao_Paulo";

const dayFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: ARENA_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function zonedParts(date: Date) {
  const parts = Object.fromEntries(
    dayFormat.formatToParts(date).map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function arenaDayStart(now: Date): Date {
  const local = zonedParts(now);
  const wallClock = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second,
  );
  const offset = wallClock - Math.floor(now.getTime() / 1000) * 1000;
  return new Date(Date.UTC(local.year, local.month - 1, local.day) - offset);
}

export {
  ARENA_DAILY_REWARDED_WINS,
  ARENA_MIN_MATCH_SECONDS,
  ARENA_TIME_ZONE,
  ARENA_WIN_REWARD,
  arenaDayStart,
};
