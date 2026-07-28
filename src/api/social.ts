import type { SocialGameDetail } from "./types";
import { getAuthHeaders } from "./util";

/**
 * Get other users' games from today.
 * @returns Games of all users from today.
 */
export async function getSocialGames(accessToken: string) {
  const res = await fetch("/api/social/games", {
    headers: getAuthHeaders(accessToken),
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status !== 200) throw new Error("Failed to fetch social games");

  return res.json() as Promise<SocialGameDetail[]>;
}
