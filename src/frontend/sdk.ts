import { exchangeCodeForAccessTokens } from "@/api/auth";
import {
  DiscordSDK,
  DiscordSDKMock,
  type IDiscordSDK,
} from "@discord/embedded-app-sdk";
import { useCallback, useState } from "react";
import { getAuthorizationCode } from "./discordApi";

const OAUTH_CLIENT_ID = process.env.WORDLE_PUBLIC_OAUTH_CLIENT_ID;
// FIXME)) When unset, these throw "ReferenceError: process is not defined" in the browser
const MOCK_GUILD_ID = process.env.WORDLE_PUBLIC_MOCK_GUILD_ID;
const MOCK_CHANNEL_ID = process.env.WORDLE_PUBLIC_MOCK_CHANNEL_ID;

export type DiscordSDKMode = "mock" | "live";

export type AuthSession = Awaited<
  ReturnType<typeof DiscordSDK.prototype.commands.authenticate>
>;

export type UseDiscordSDKReturn = {
  discordSdk: IDiscordSDK;
  sdkMode: DiscordSDKMode;
  authSession: AuthSession | null;
  // Access token for the backend API
  accessToken: string | null;
  authenticate: () => Promise<AuthSession>;
};

export function useDiscordSdk(sdkMode: DiscordSDKMode): UseDiscordSDKReturn {
  const [discordSdk] = useState(() => {
    if (!OAUTH_CLIENT_ID) {
      throw new Error("WORDLE_PUBLIC_OAUTH_CLIENT_ID is not set");
    }

    if (sdkMode === "live") {
      return new DiscordSDK(OAUTH_CLIENT_ID);
    }

    if (!MOCK_GUILD_ID) {
      throw new Error("WORDLE_PUBLIC_MOCK_GUILD_ID must be set for mock SDK mode");
    }
    if (!MOCK_CHANNEL_ID) {
      throw new Error("WORDLE_PUBLIC_MOCK_CHANNEL_ID must be set for mock SDK mode");
    }
    console.debug("Using mock Discord SDK");
    console.debug("Client ID:", OAUTH_CLIENT_ID);
    console.debug("Guild ID:", MOCK_GUILD_ID);
    console.debug("Channel ID:", MOCK_CHANNEL_ID);
    return new DiscordSDKMock(OAUTH_CLIENT_ID, MOCK_GUILD_ID, MOCK_CHANNEL_ID, null);
  });
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const setAuthState = useCallback((authSession: AuthSession, accessToken: string) => {
    setAuthSession(authSession);
    setAccessToken(accessToken);
  }, []);

  const authenticate = async () => {
    if (!discordSdk.guildId) {
      throw new Error("Discord SDK is not initialized with a guild ID");
    }

    const authorizationCode = await getAuthorizationCode(discordSdk);
    console.log("Authorization code received");

    if (sdkMode === "mock") {
      console.log("Authenticating with mock credentials");
    }

    // Backend uses a mocked Discord access token, but still signs a JWT for its API
    const { discordAccessToken, backendAccessToken } =
      await exchangeCodeForAccessTokens(authorizationCode, discordSdk.guildId);
    console.log("Access tokens received");

    // Under "mock" mode, `authenticate()` doesn't check the token
    const session = await discordSdk.commands.authenticate({
      access_token: discordAccessToken,
    });
    console.log(`Authenticated user ${session.user.username} (${session.user.id})`);

    setAuthState(session, backendAccessToken);

    return session;
  };

  return {
    discordSdk,
    sdkMode,
    authSession,
    accessToken,
    authenticate,
  };
}
