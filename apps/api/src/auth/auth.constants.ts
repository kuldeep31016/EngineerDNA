/** Cookie names for the auth tokens. Tokens live ONLY in HTTP-only cookies. */
export const ACCESS_TOKEN_COOKIE = "edna_access";
export const REFRESH_TOKEN_COOKIE = "edna_refresh";

/** JWT payload carried by the access token. */
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
}
