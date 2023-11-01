FROM node:20.9.0

ENV NODE_ENV=production

WORKDIR /app

COPY ./package*.json /app/

RUN npm ci --omit=dev --ignore-scripts

COPY ./headless-server-build/ /app/headless-server-build/

ENV PORT=8080

EXPOSE $PORT 

ENTRYPOINT [ "npm", "run", "headless-run-server"]