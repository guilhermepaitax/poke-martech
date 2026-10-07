function formatCardNumber(number: number) {
  return `#${String(number).padStart(3, "0")}`;
}

export { formatCardNumber };
