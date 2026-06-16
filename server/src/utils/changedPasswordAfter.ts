export const changedPasswordAfter = (
  passwordChangedAt: Date | null,
  jwtIssuedAt: number,
): boolean => {
  if (!passwordChangedAt) return false;

  // Convert Date → seconds (JWT iat is in seconds)
  const changedTimestamp = Math.floor(passwordChangedAt.getTime() / 1000);

  return changedTimestamp > jwtIssuedAt;
};
