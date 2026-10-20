const RATE_LIMITS = {
  follow: { name: "follow", windowSeconds: 60, max: 30 },
  tradeCreate: { name: "trade-create", windowSeconds: 60, max: 10 },
  tradeAction: { name: "trade-action", windowSeconds: 60, max: 30 },
  openPack: { name: "open-pack", windowSeconds: 60, max: 20 },
  upload: { name: "upload", windowSeconds: 60, max: 30 },
} as const;

export { RATE_LIMITS };
