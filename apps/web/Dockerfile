FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm ci --workspace=@fixmyroad/web

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @fixmyroad/web

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "apps/web/server.js"]
