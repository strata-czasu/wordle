import env from "@/env";
import { REST } from "@discordjs/rest";
import { InteractionContextType, Routes } from "discord-api-types/v10";
import {
  ApplicationCommandType,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord-api-types/v10";

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
  {
    type: ApplicationCommandType.ChatInput,
    name: "wordle",
    description: "Graj w Wordle",
    contexts: [InteractionContextType.Guild],
  },
  {
    type: ApplicationCommandType.ChatInput,
    name: "share",
    description: "Udostępnij swój dzisiejszy wynik Wordle",
    contexts: [InteractionContextType.Guild],
  },
] as const;

async function registerGuildCommands(token: string, appId: string, guildId: string) {
  const rest = new REST().setToken(token);

  try {
    const currentCommands = (await rest.get(
      Routes.applicationGuildCommands(appId, guildId),
    )) as { id: string; name: string }[];

    const commandsToDelete = currentCommands
      .filter((command) => !commands.some((c) => c.name === command.name))
      .map(({ id }) => Routes.applicationGuildCommand(appId, guildId, id));

    await Promise.all(commandsToDelete.map((route) => rest.delete(route)));

    await rest.put(Routes.applicationGuildCommands(appId, guildId), {
      body: commands,
    });

    console.log(`Registered application commands for guild ${guildId}`);
  } catch (error) {
    console.error(error);
  }
}

async function registerCommands(token: string, appId: string, guildIds: string[]) {
  console.log(`Registering application commands for ${guildIds.join(", ")}`);
  await Promise.all(
    guildIds.map((guildId) => registerGuildCommands(token, appId, guildId)),
  );
}

await registerCommands(
  env.WORDLE_BOT_TOKEN,
  env.WORDLE_PUBLIC_APPLICATION_ID,
  env.WORDLE_BOT_COMMAND_GUILD_IDS,
);
