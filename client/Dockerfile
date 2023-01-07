FROM node:latest

WORKDIR /app

COPY package.json /app/

RUN yarn install

COPY . /app/

EXPOSE 3000

CMD ["yarn", "dev"]