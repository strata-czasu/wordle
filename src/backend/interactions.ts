import { GameState } from "@/db";
import env from "@/env";
import { getShareText } from "@/util/sharing";
import type { BunRequest } from "bun";
import {
  type APIApplicationCommandInteraction,
  type APIInteraction,
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from "discord-api-types/v10";
import { verifyKey } from "discord-interactions";
import { getCurrentGame } from "./game";

const BadRequestSignature = new Response("Bad request signature", { status: 401 });

export const interactionsApi = {
  // https://docs.discord.com/developers/events/webhook-events#responding-to-events
  "/api/interactions": {
    POST: async (req: BunRequest<"/api/interactions">): Promise<Response> => {
      if (!(await verifyRequest(req))) return BadRequestSignature;

      const msg = (await req.json()) as APIInteraction;

      if (msg.type === InteractionType.Ping) {
        return Response.json({ type: InteractionResponseType.Pong });
      }

      if (msg.type === InteractionType.ApplicationCommand) {
        return handleApplicationCommand(msg);
      }

      throw new Error(`Unknown interaction type: ${msg.type}`);
    },
  },
};

async function verifyRequest(req: BunRequest): Promise<boolean> {
  const signature = req.headers.get("X-Signature-Ed25519");
  const timestamp = req.headers.get("X-Signature-Timestamp");
  if (!signature || !timestamp) return false;

  return verifyKey(
    await req.clone().text(),
    signature,
    timestamp,
    env.WORDLE_APPLICATION_PUBLIC_KEY,
  );
}

async function handleApplicationCommand(msg: APIApplicationCommandInteraction) {
  if (msg.data.type !== ApplicationCommandType.ChatInput) {
    throw new Error(`Unknown application command type: ${msg.data.type}`);
  }

  if (msg.data.name === "wordle") {
    return Response.json({
      type: InteractionResponseType.LaunchActivity,
    });
  }

  if (msg.data.name === "wynik") {
    const guildId = msg.guild_id;
    const userId = msg.member?.user?.id;
    if (!guildId || !userId) {
      return Response.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "Komenda musi być użyta na serwerze",
          flags: MessageFlags.Ephemeral,
        },
      });
    }

    console.log(userId, guildId);
    const game = await getCurrentGame(userId, guildId);
    console.log(game);
    if (!game || game.state === GameState.inProgress) {
      return Response.json({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "Ukończ najpierw grę, aby ją udostępnić",
          flags: MessageFlags.Ephemeral,
        },
      });
    }

    return Response.json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: getShareText(game.guesses),
      },
    });
  }

  throw new Error(`Unknown chat input command: ${msg.data.name}`);
}
