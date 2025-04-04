# 1st Stage: Build
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl
COPY package*.json ./
RUN npm install
RUN npm install --save-dev @types/express @types/redis @types/node @types/elasticsearch
COPY prisma ./prisma
COPY .env ./
RUN npx prisma generate
COPY . .
RUN npm run build

# 2nd Stage: Production
FROM node:20-slim AS runtime
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env ./
RUN npm install --omit=dev
EXPOSE 3000
CMD ["node", "dist/index.js"]
