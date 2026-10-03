// shared display formatting - keep one version of each so the app reads the same everywhere

// "english_literature" -> "English Literature"
export const formatString = (string?: string): string => {
  if (!string) return "";

  return string.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

// subject enum values keep their casing, just lose the underscores ("English_Literature" -> "English Literature")
export const formatSubject = (subject: string): string => subject.replace(/_/g, " ");

const moneyFormatters = new Map<string, Intl.NumberFormat>();

// £12.50 - formatters are cached per currency
export const formatMoney = (amount: number, currency = "GBP"): string => {
  let formatter = moneyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-GB", { style: "currency", currency });
    moneyFormatters.set(currency, formatter);
  }
  return formatter.format(amount);
};

// "1 slot" / "3 slots"
export const pluralise = (count: number, word: string): string =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

// 12 -> "12 hours", 24 -> "1 day", 48 -> "2 days". callers decide what 0 means
export const formatHours = (hours: number): string => {
  if (hours > 0 && hours % 24 === 0) return pluralise(hours / 24, "day");
  return `${hours} hours`;
};

// 90 -> "1h 30m", 120 -> "2h", 45 -> "45m"
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
};
