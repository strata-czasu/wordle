# Wordle Discord Activity

# Running and deployment

## Basic setup

1. Create an `.env` file using the `.env.example` file as a template
2. Create a Discord Application (or use an existing one) and go through settings:
   1. "Overview" -> "General Information":
      - Application ID -> `WORDLE_PUBLIC_APPLICATION_ID` env
      - Public Key -> `WORDLE_APPLICATION_PUBLIC_KEY` env
   2. "Overview" -> "Installation":
      - Installation Contexts -> enable "Guild Install"
      - Default Install Settings -> Scopes -> Add only the `application.commands` scope
      - Install Link -> copy the Discord provided link and install the app in your server
   3. "Overview" -> "OAuth2":
      - Client Secret -> `WORDLE_OAUTH_CLIENT_SECRET` env
      - Add a redirect URI of `https://127.0.0.1`
   4. "Overview" -> "Bot":
      - Bot Token -> `WORDLE_BOT_TOKEN` env
   5. "Activities" -> "Settings":
      - Check "Enable Activities"
   6. "Activities" -> "URL Mappings":
      - Point the root mapping to a public URL where your application will be exposed to, i.e. `https://your-domain.com`
3. Set `WORDLE_BOT_COMMAND_GUILD_IDS` - app commands will be synced to these guilds only
4. Set `WORDLE_SECRET_KEY` to a randomly generated string
5. (optional) Provide a default wordlist with `WORDLE_AVAILABLE_WORDS_FILE` pointing to a JSON file containing a list of words the game will pick from when starting new games; they also need to be in the frontend valid words file

## Running locally

To run the app without Discord, set `WORDLE_PUBLIC_DISCORD_SDK_MODE` to `mock` and set relevant mock IDs in the `.env` file; the app will now work in a regular browser window without logging in via Discord

To run the app end-to-end through Discord, use [cloudflared](https://github.com/cloudflare/cloudflared), [ngrok](https://ngrok.com/) or expose your local server to the internet, so Discord's servers can access your application. `WORDLE_PUBLIC_DISCORD_SDK_MODE` must be set to `live` in order to authenticate via Discord.

1. Run `bun prisma-generate` and `bun prisma-push`
2. Sync commands to Discord with `bun reload-commands`
3. Start the application with `bun dev`

## Production deployment (Docker)

TODO: Automatically sync commands when running in Docker

1. Mount a persistent volume at `/appdata` - the Docker image ensures this directory is accessible to the application and can be used to persist the database
2. Set `WORDLE_DATABASE_URL` to `file:/appdata/wordle.db`
3. Expose the application's `3000` port to a public URL accessible from the internet (the same URL set in the activity root URL mapping)

## Post-deployment setup

1. In the Discord Developer Portal -> Overview -> General Information -> Interactions Endpoint URL, set the value to your public URL where the application is exposed with the `/api/interactions` suffix, i.e. `https://your-domain.com/api/interactions`
2. Applying the above change will verify the endpoint and enable Discord to send commands to the app
