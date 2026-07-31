import env from "@/env";
import { REST } from "@discordjs/rest";
import type { BunRequest } from "bun";
import { add } from "date-fns";
import {
  OAuth2Routes,
  type RESTGetAPICurrentUserResult,
  type RESTPostOAuth2AccessTokenResult,
  Routes,
} from "discord-api-types/v10";
import * as jose from "jose";
import * as v from "valibot";
import { AuthTokenExchangeError } from "./error";
import { authenticateRequest } from "./util";

console.log("[auth] Using Discord SDK mode:", env.WORDLE_PUBLIC_DISCORD_SDK_MODE);
console.log("[auth] Using OAuth client ID:", env.WORDLE_PUBLIC_APPLICATION_ID);

const ApiTokenRequestSchema = v.object({
  code: v.string(),
  guildId: v.string(),
});

export const authApi = {
  // Exchange Discord client authorization code for access tokens
  "/api/auth/token": {
    async POST(req: BunRequest<"/api/auth/token">): Promise<Response> {
      const { code, guildId } = v.parse(ApiTokenRequestSchema, await req.json());

      const discordAccessToken = await exchangeAuthorizationCode(code);

      let userId: string | undefined;
      if (env.WORDLE_PUBLIC_DISCORD_SDK_MODE === "live") {
        try {
          const rest = new REST({ authPrefix: "Bearer" });
          rest.setToken(discordAccessToken);
          const user = (await rest.get(
            Routes.user("@me"),
          )) as RESTGetAPICurrentUserResult;
          userId = user.id;
        } catch (e) {
          return Response.json(
            { message: "Failed to fetch user info" },
            { status: 400 },
          );
        }
      } else {
        // NOTE: Using the same string as `DiscordSDKMock`
        userId = "mock_user_id";
      }

      const jwtExpiry = add(new Date(), { hours: 1 });
      const jwtSecret = new TextEncoder().encode(env.WORDLE_JWT_SECRET);
      const backendAccessToken = await new jose.SignJWT({ userId, guildId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer(env.WORDLE_PUBLIC_APPLICATION_ID)
        .setIssuedAt()
        .setExpirationTime(jwtExpiry)
        .sign(jwtSecret);

      return Response.json({
        discordAccessToken,
        backendAccessToken,
      });
    },
  },
  "/api/auth/session/verify": {
    async POST(req: BunRequest<"/api/auth/session/verify">): Promise<Response> {
      const { userId, guildId } = await authenticateRequest(req);

      return Response.json({ userId, guildId }, { status: 200 });
    },
  },
};

/**
 * @param code Discord authorization code
 * @returns Discord access token
 */
async function exchangeAuthorizationCode(code: string): Promise<string> {
  if (env.WORDLE_PUBLIC_DISCORD_SDK_MODE === "mock") {
    return "mock_access_token";
  }

  const res = await fetch(OAuth2Routes.tokenURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.WORDLE_PUBLIC_APPLICATION_ID,
      client_secret: env.WORDLE_OAUTH_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
    }),
  });

  if (res.status !== 200) {
    console.log("Error from oauth2 token exchange:", res);
    throw new AuthTokenExchangeError(res.status);
  }

  const { access_token: discordAccessToken } =
    (await res.json()) as RESTPostOAuth2AccessTokenResult;

  return discordAccessToken;
}
