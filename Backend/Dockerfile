FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

ENV DIRECT_URL="postgresql://dummy"
RUN npx prisma generate
RUN npx tsc -p tsconfig.build.json

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
