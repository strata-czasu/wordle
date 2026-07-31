import env from "@/env";
import type { BunRequest } from "bun";
import { ApplicationCommandType } from "discord-api-types/v10";
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from "discord-interactions";

const BadRequestSignature = new Response("Bad request signature", { status: 401 });

export const interactionsApi = {
  // https://docs.discord.com/developers/events/webhook-events#responding-to-events
  "/api/interactions": {
    POST: async (req: BunRequest<"/api/interactions">): Promise<Response> => {
      if (!(await verifyRequest(req))) return BadRequestSignature;

      const msg = await req.json();

      if (msg.type === InteractionType.PING) {
        return Response.json({ type: InteractionResponseType.PONG });
      }

      if (msg.type === InteractionType.APPLICATION_COMMAND) {
        if (msg.data.type !== ApplicationCommandType.ChatInput) {
          return new Response("Unknown command type", { status: 400 });
        }

        if (msg.data.name === "wordle") {
          return Response.json({
            type: InteractionResponseType.LAUNCH_ACTIVITY,
          });
        }

        if (msg.data.name === "share") {
          // TODO)) Get todays result from the db and share it
          return Response.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: "Hello, world! (/share)",
            },
          });
        }

        return new Response("Unknown command", { status: 400 });
      }

      return new Response("Unknown interaction type", { status: 400 });
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
