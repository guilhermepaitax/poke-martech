export const formatBaseUrl = (url: string) => {
  if (url.includes("http://") || url.includes("https://")) {
    return url;
  }

  return `https://${url}`;
};
