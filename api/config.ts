export const config = {
  port: parseInt(process.env.PORT || "3000"),
  jwtSecret: getEnv(process.env.JWT_SECRET, "JWT_SECRET"),
  accessTokenExpire: 60 * 60 * 1000, // Expiration 1 heure (60 minutes * 60 secondes * 1000 = 3 600 000 millisecondes)
  refreshTokenExpire: 7 * 24 * 60 * 60 * 1000, // Expiration à 7 jours (7 jours * 24 heures * 60 minutes * 60 secondes * 1000)
};

function getEnv(value: string | undefined, variableName: string) {
  if (!value) {
    throw new Error(`Missing env variable: ${variableName}`);
  }
  return value;
}
