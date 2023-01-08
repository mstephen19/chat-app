FROM node:latest

WORKDIR /app

COPY package.json /app/

RUN yarn install

COPY . /app/

EXPOSE 5173

# Dev server only works in Docker if we do this
CMD ["yarn", "dev", "--", "--host", "0.0.0.0"]