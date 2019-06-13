FROM nginx:1.15.7-alpine
LABEL maintainer="grushton@broadinstitute.org"
RUN rm -rf /etc/nginx/conf.d
COPY /root/project/conf /etc/nginx
COPY /root/project/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
