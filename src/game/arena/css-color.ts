function cssColor(variable: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}

function cssColorNumber(variable: string, fallback: number): number {
  const value = cssColor(variable, "");
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return Number.parseInt(value.slice(1), 16);
  return fallback;
}

export { cssColor, cssColorNumber };
