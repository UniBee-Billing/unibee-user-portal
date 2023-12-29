FROM nginx:1.20
COPY ./dist /usr/share/nginx/html/unib
COPY ./nginx.conf /etc/nginx/conf.d