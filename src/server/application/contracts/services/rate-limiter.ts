type RateLimitRule = {
  windowSeconds: number;
  max: number;
};

type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

interface RateLimiter {
  consume(key: string, rule: RateLimitRule): Promise<RateLimitDecision>;
}

export type { RateLimitDecision, RateLimiter, RateLimitRule };
