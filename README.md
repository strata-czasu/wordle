# Wordle Discord Activity

# Running and deployment

## Basic setup

1. Create a Discord Application (or use an existing one)
2. In Overview->OAuth2 settings:
   - Note down the client ID and client secret
   - Add a redirect URI of `https://127.0.0.1`
3. In Activities->Settings:
   - Check "Enable Activities"
4. In Activities->URL Mappings:
   - Point the root mapping to a public URL where your application will be exposed to
   - If running locally, use [cloudflared](https://github.com/cloudflare/cloudflared) or [ngrok](https://ngrok.com/) to create a public URL for your locally running app
5. Create an `.env` file using the `.env.example` file as a template
6. Fill `WORDLE_PUBLIC_OAUTH_CLIENT_ID` and `WORDLE_OAUTH_CLIENT_SECRET` with previously obtained OAuth2 credentials credentials
7. Fill `WORDLE_SECRET_KEY` with a random string
8. (optional) Provide a default wordlist with `WORDLE_AVAILABLE_WORDS_FILE` pointing to a JSON file containing a list of words the game will pick from when starting new games; they also need to be in the frontend valid words file

## Running locally

1. Run `bun prisma-generate` and `bun prisma-push`
2. Start the application with `bun dev`
3. To run the app without Discord, set `WORDLE_PUBLIC_DISCORD_SDK_MODE` to `mock` and set relevant mock IDs in the `.env` file; the app will now work in a regular browser window without logging in via Discord

## Production deployment (Docker)

1. Mount a persistent volume at `/appdata` - the Docker image ensures this directory is accessible to the application and can be used to persist the database
2. Set `WORDLE_DATABASE_URL` to `file:/appdata/wordle.db`
3. Expose the application's `3000` port to a public URL accessible from the internet (the same URL set in the activity root URL mapping)
