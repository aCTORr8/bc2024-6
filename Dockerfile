# syntax=docker/dockerfile:1
ARG NODE_VERSION=20.17.0
FROM node:${NODE_VERSION}-alpine

COPY package.json package-lock.json ./ 

ENV NODE_ENV production

WORKDIR /usr/src/app

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

RUN mkdir -p /usr/src/app/cache && chown -R node:node /usr/src/app/cache

USER node

COPY . .

EXPOSE 8800
EXPOSE 9229

CMD ["npx", "nodemon", "--inspect=0.0.0.0:9229", "index.js", "--", "-h", "0.0.0.0", "-p", "8800", "-c", "./cache"]
