# builder image
FROM node:24.15.0-trixie AS builder
LABEL maintainer="dsp-data-team@broadinstitute.org"

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY src /usr/src/app/src
COPY public /usr/src/app/public
COPY package.json /usr/src/app/package.json
COPY pnpm-lock.yaml /usr/src/app/pnpm-lock.yaml
COPY pnpm-workspace.yaml /usr/src/app/pnpm-workspace.yaml
COPY index.html /usr/src/app/index.html
COPY tsconfig.json /usr/src/app/tsconfig.json
COPY vite.config.ts /usr/src/app/vite.config.ts
COPY config/base_config.json /usr/src/app/public/config.json
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate
RUN pnpm config set update-notifier false
RUN pnpm install --frozen-lockfile --loglevel warn
RUN pnpm run build

# build the server
COPY server /usr/src/app/server
RUN pnpm --dir /usr/src/app/server --ignore-workspace install --frozen-lockfile \
	&& pnpm --dir /usr/src/app/server --ignore-workspace run build \
	&& pnpm --dir /usr/src/app/server --ignore-workspace install --prod --frozen-lockfile --loglevel warn

# Commit hash to us.gcr.io/broad-dsp-gcr-public/base/nodejs:24-alpine
FROM us.gcr.io/broad-dsp-gcr-public/base/nodejs@sha256:7bb73493171d6c0b1bf00018915266cf8e80910b172d14bf249dcd01af8f3aa9
ARG NODE_ENV=production
ARG PORT=8080
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}
WORKDIR /usr/src/app
COPY --chmod=550 --chown=node:node --from=builder /usr/src/app/build ./build
COPY --chmod=550 --chown=node:node --from=builder /usr/src/app/server ./server
USER node
EXPOSE ${PORT}
CMD ["node", "server/dist/index.js"]
