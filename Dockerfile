# builder image
FROM node:20.0.0 AS builder
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
RUN npm config set update-notifier false
RUN npm install --silent
RUN npm run build --silent

FROM us.gcr.io/broad-dsp-gcr-public/base/nginx:mainline-alpine
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
RUN rm -rf /etc/nginx/conf.d
COPY conf /etc/nginx
CMD ["nginx", "-g", "daemon off;"]
