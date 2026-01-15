FROM node:20-bullseye

WORKDIR /backend

COPY . .

RUN npm install -g npm@10 && npm cache clean --force && npm ci

EXPOSE 3000
CMD [ "node", "app.js" ]