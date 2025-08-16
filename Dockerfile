ARG BUN_VERSION=1.2.19

FROM oven/bun:${BUN_VERSION}-slim

RUN apt-get update \
  && apt-get -y install --no-install-recommends openssl \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --link bun.lock package.json ./
RUN bun install --production

COPY --link . .

RUN bun prisma-generate
RUN mkdir -p /appdata/wordle && chown -R bun:bun /appdata/wordle

USER bun
CMD ["bun", "start:prod"]
