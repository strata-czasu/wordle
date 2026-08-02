import "./index.css";

import { useLayoutEffect, useState } from "react";
import Wordle from "./Wordle";
import { type DiscordSDKMode, useDiscordSdk } from "./sdk";
import { SocialSidebar } from "./social/Social";

const SDK_MODE =
  // FIXME)) When unset, this throws "ReferenceError: process is not defined" in the browser
  (process.env.WORDLE_PUBLIC_DISCORD_SDK_MODE as DiscordSDKMode | undefined) ?? "live";

export function App() {
  const { discordSdk, authSession, accessToken, authenticate } =
    useDiscordSdk(SDK_MODE);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const startAuth = async () => {
    if (isAuthenticating) return;

    await discordSdk.ready();
    console.log("Discord SDK is ready");

    setIsAuthenticating(true);
    await authenticate();
    setIsAuthenticating(false);
  };

  // Automatically start authentication on app load
  useLayoutEffect(() => {
    if (authSession && accessToken) return;
    startAuth();
  });

  return (
    // TODO)) Ensure we're never overflowing - shrink the whole page if needed for smaller screens
    <div className="w-full h-screen p-2 sm:p-4 md:p-8 text-center flex flex-col justify-center">
      {discordSdk.guildId && authSession && accessToken ? (
        <div className="grid grid-cols-[1fr_auto_1fr] max-sm:grid-cols-1 gap-2">
          <div className="max-sm:hidden">
            <SocialSidebar accessToken={accessToken} />
          </div>
          <div>
            <Wordle
              guildId={discordSdk.guildId}
              userId={authSession.user.id}
              accessToken={accessToken}
            />
          </div>
          {/* NOTE: 3rd grid column just to balance out the layout */}
          <div className="max-sm:hidden" />
        </div>
      ) : (
        <div>
          <div className="text-3xl sm:text-4xl md:text-5xl mb-4">Wordle</div>
          {isAuthenticating ? (
            <div className="text-gray-500">Logowanie...</div>
          ) : (
            <button
              type="button"
              className="px-4 py-2 my-4 text-white rounded bg-blue-600 hover:bg-blue-700 transition-colors"
              onClick={startAuth}
            >
              Zaloguj się przez Discord aby zagrać
            </button>
          )}
        </div>
      )}
    </div>
  );
}
export default App;
