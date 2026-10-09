function safeReturnPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  let url: URL;
  try {
    url = new URL(value, "http://localhost");
  } catch {
    return fallback;
  }
  if (url.origin !== "http://localhost" || !url.pathname.startsWith("/")) return fallback;
  return `${url.pathname}${url.search}`;
}

function withReturnTo(href: string, returnTo: string) {
  const url = new URL(href, "http://localhost");
  url.searchParams.set("voltar", returnTo);
  return `${url.pathname}${url.search}`;
}

export { safeReturnPath, withReturnTo };
