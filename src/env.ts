import * as v from "valibot";

const DiscordSDKMode = v.union([v.literal("mock"), v.literal("live")]);
const ID = v.pipe(v.string(), v.regex(/^\d{17,19}$/));

const SpaceSeparatedArray = <
  TInput extends v.BaseSchema<string, unknown, v.BaseIssue<unknown>>,
>(
  matcher: TInput,
) =>
  v.pipe(
    v.string(),
    v.transform((value) => value.split(" ")),
    v.array(matcher),
  );

const Env = v.object({
  WORDLE_PUBLIC_DISCORD_SDK_MODE: DiscordSDKMode,
  WORDLE_PUBLIC_APPLICATION_ID: ID,
  WORDLE_OAUTH_CLIENT_SECRET: v.string(),
  WORDLE_APPLICATION_PUBLIC_KEY: v.string(),
  WORDLE_BOT_TOKEN: v.string(),
  WORDLE_BOT_COMMAND_GUILD_IDS: SpaceSeparatedArray(ID),
  WORDLE_JWT_SECRET: v.string(),
  WORDLE_DATABASE_URL: v.pipe(v.string(), v.url()),
  WORDLE_AVAILABLE_WORDS_FILE: v.optional(v.string()),
  HOST: v.optional(v.string()),
  PORT: v.optional(v.string()),
  TZ: v.optional(v.string()),
});

export default v.parse(Env, process.env);
