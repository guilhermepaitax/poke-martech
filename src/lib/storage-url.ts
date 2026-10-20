function isStorageUrl(value: string, publicUrl: string | undefined = process.env.R2_PUBLIC_URL) {
  const base = publicUrl?.replace(/\/$/, "");
  if (!base) return false;
  return value.startsWith(`${base}/`);
}

export { isStorageUrl };
