# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 19012
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:19012"]
