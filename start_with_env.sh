#!/usr/bin/env sh

find '/usr/share/nginx/html' -name '*.js' -exec sed -i -e 's,UNIBEE_API_URL,'"$UNIBEE_API_URL"',g' {} \;
nginx -g "daemon off;"