# builder image
FROM node:24.18.0-trixie AS builder
LABEL maintainer="dsp-data-team@broadinstitute.org"

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

# Copy manifests before source so the dep-install layer is cached independently
# of source changes — pnpm ci only re-runs when package.json/lockfile change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/package.json
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate
RUN pnpm config set update-notifier false
RUN pnpm ci --loglevel warn

# Build frontend
COPY src ./src
COPY public ./public
COPY index.html aliases.ts tsconfig.json vite.config.ts ./
COPY scripts ./scripts
COPY config/base_config.json ./public/config.json
RUN pnpm exec vite build && node scripts/write-vite-config-json.mjs

# Build server
COPY server/src ./server/src
COPY server/tsconfig.json ./server/tsconfig.json
RUN pnpm --filter duos-server run build

# Create a self-contained prod-only server bundle (no devDeps, no workspace symlinks)
RUN pnpm --filter duos-server deploy --prod --legacy /tmp/server-deploy

# Commit hash to us.gcr.io/broad-dsp-gcr-public/base/nodejs:24-debian
FROM us.gcr.io/broad-dsp-gcr-public/base/nodejs@sha256:3289da9ee7c03c4a6f317dcdd767722857d4b12c288edeea4ec4b6d152bd97a8
ARG NODE_ENV=production
ARG PORT=8080
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}
WORKDIR /usr/src/app
COPY --chmod=550 --chown=node:node --from=builder /usr/src/app/build ./build
COPY --chmod=550 --chown=node:node --from=builder /tmp/server-deploy ./server
COPY --chmod=444 --chown=node:node --from=builder /usr/src/app/package.json ./package.json
USER node
EXPOSE ${PORT}
CMD ["node", "server/dist/index.js"]
