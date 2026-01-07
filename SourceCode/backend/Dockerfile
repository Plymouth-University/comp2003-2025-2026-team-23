FROM node:latest

WORKDIR /backend

COPY . .

RUN npm install

EXPOSE 3000
CMD [ "node", "app.js" ]