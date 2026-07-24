type TokenExchangeReturn = {
  discordAccessToken: string;
  backendAccessToken: string;
};

export async function exchangeCodeForAccessTokens(
  code: string,
  guildId: string,
): Promise<TokenExchangeReturn> {
  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, guildId }),
  });

  if (!res.ok) {
    throw new Error("Failed to exchange authorization code for access tokens");
  }

  const data = (await res.json()) as TokenExchangeReturn;
  if (typeof data.discordAccessToken !== "string") {
    throw new Error("Invalid discord access token received");
  }
  if (typeof data.backendAccessToken !== "string") {
    throw new Error("Invalid backend access token received");
  }

  return data;
}
