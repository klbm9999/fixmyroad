FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages packages
COPY apps apps
RUN npm ci 2>/dev/null || npm install
RUN npm run build -w @fixmyroad/shared 2>/dev/null; npm run build -w @fixmyroad/api

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main.js"]
