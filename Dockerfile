# builder image
FROM node:26.4.0-trixie AS builder
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
RUN npm install -g corepack@0.35.0 --ignore-scripts && corepack enable && corepack prepare pnpm@11.15.1 --activate
RUN pnpm config set update-notifier false
RUN pnpm ci --loglevel warn --ignore-scripts

# Build frontend
COPY src ./src
COPY public ./public
COPY index.html aliases.ts tsconfig.json vite.config.ts ./
COPY scripts ./scripts
COPY config/base_config.json ./public/config.json
RUN pnpm exec vite build && node scripts/write-vite-config-json.mjs

# Build server
COPY server/src ./server/src
COPY server/tsconfig.json server/tsconfig.build.json ./server/
RUN pnpm --filter duos-server run build

# Create a self-contained prod-only server bundle (no devDeps, no workspace symlinks)
RUN pnpm --filter duos-server deploy --prod --legacy /tmp/server-deploy

# Commit hash to us.gcr.io/broad-dsp-gcr-public/base/nodejs:26-debian-fips
FROM us.gcr.io/broad-dsp-gcr-public/base/nodejs@sha256:a06715bf6ffaa7672caca4a5c5924ebec4f3100b0bbdbebd589857cfb57f986b
ARG NODE_ENV=production
ARG PORT=8080
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}
ENV OPENSSL_FORCE_FIPS_MODE=1
WORKDIR /usr/src/app
COPY --chmod=550 --chown=node:node --from=builder /usr/src/app/build ./build
COPY --chmod=550 --chown=node:node --from=builder /tmp/server-deploy ./server
COPY --chmod=444 --chown=node:node --from=builder /usr/src/app/package.json ./package.json
USER node
EXPOSE ${PORT}
CMD ["node", "--enable-fips", "server/dist/index.js"]
