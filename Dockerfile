# syntax=docker/dockerfile:1
ARG BUN_VERSION=1.3.10

# ---- build: install, test, bundle the client
FROM oven/bun:${BUN_VERSION}-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY tsconfig.json ./
COPY scripts ./scripts
COPY src ./src
COPY tests ./tests
RUN bun test && bun run build

# ---- runtime: just Bun, the server and the built client
FROM oven/bun:${BUN_VERSION}-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=7777 \
    HOST=0.0.0.0 \
    DATA_DIR=/data \
    DIST_DIR=/app/dist
COPY --from=build /app/dist ./dist
COPY src/server ./src/server
RUN mkdir -p /data && chown -R bun:bun /data
USER bun
VOLUME ["/data"]
EXPOSE 7777
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s CMD ["bun", "src/server/healthcheck.ts"]
CMD ["bun", "src/server/index.ts"]
