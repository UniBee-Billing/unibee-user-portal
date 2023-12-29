FROM nginx:1.20
COPY ./dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d