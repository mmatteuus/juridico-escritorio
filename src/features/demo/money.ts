const BRL_INPUT = /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/;

/** Parse a Brazilian currency value into integer cents without float rounding. */
export function parseBrlCents(input: string): number | null {
  const value = input.trim();
  if (!BRL_INPUT.test(value)) return null;
  const [whole, fraction = ""] = value.replaceAll(".", "").split(",");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function formatBrlCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
