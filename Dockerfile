FROM node:24-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ARG DATABASE_URL
ARG PORT
ARG CEP_SERVICE_API_URL
ARG CDN_URL
ARG BUCKET_NAME
ARG LAMBDA_PRESIGNED_URL
ARG NODE_ENV


RUN DATABASE_URL=$DATABASE_URL npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/src/main"]