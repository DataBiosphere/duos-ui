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
COPY package-lock.json /usr/src/app/package-lock.json
COPY index.html /usr/src/app/index.html
COPY tsconfig.json /usr/src/app/tsconfig.json
COPY vite.config.ts /usr/src/app/vite.config.ts
COPY config/base_config.json /usr/src/app/public/config.json
RUN npm config set update-notifier false
RUN npm install --loglevel verbose
RUN npm run build

FROM us.gcr.io/broad-dsp-gcr-public/base/nodejs:20-debian
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/build ./build
RUN npm install -g serve
EXPOSE 8080
CMD ["serve", "-s", "build", "-l", "8080"]
