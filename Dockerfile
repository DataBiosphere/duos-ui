# builder image
FROM node:16.13.0-slim AS builder
LABEL maintainer="grushton@broadinstitute.org"

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY src /usr/src/app/src
COPY public /usr/src/app/public
COPY package.json /usr/src/app/package.json
COPY config/base_config.json /usr/src/app/public/config.json
# version berry is yarn's active development repo, npm repo (1.x) is dead
RUN yarn set version berry
# sets yarn version to latest major (non-breaking), update as breaking version updates are tested and approved
RUN yarn set version 3.x
# Note timeout -> material-ui/icons is incredibly large, timeout adjustment often recommended
RUN yarn install --network-timeout 500000 --silent
#ESLint plugin can cause slowdowns for yarn, no need to enable it on deployment
RUN yarn run build DISABLE_ESLINT_PLUGIN=true --silent

FROM us.gcr.io/broad-dsp-gcr-public/base/nginx:mainline-alpine
RUN rm -rf /etc/nginx/conf.d
COPY conf /etc/nginx
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
