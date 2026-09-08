export const formatString = (string?: string): string => {
  if (!string) return "";

  return string
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
