FROM nginxinc/nginx-unprivileged:1.19.4-alpine
LABEL maintainer="grushton@broadinstitute.org"
RUN rm -rf /etc/nginx/conf.d
COPY conf /etc/nginx
COPY build /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
