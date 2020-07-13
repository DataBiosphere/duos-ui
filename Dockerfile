FROM nginx:1.19.1-alpine
LABEL maintainer="grushton@broadinstitute.org"
RUN rm -rf /etc/nginx/conf.d
COPY conf /etc/nginx
COPY build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
