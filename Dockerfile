FROM node:20-alpine AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./backend/
COPY client/package.json client/package-lock.json ./client/
RUN cd backend && npm ci
RUN cd client && npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY backend ./backend
COPY client ./client
RUN cd client && npm run build
RUN cd backend && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/client/.next ./client/.next
COPY --from=builder /app/client/public ./client/public
COPY --from=builder /app/client/node_modules ./client/node_modules
COPY --from=builder /app/client/package.json ./client/package.json

ENV PORT=4001
ENV CLIENT_ORIGIN=http://localhost:3000
EXPOSE 4001
EXPOSE 3000

CMD sh -c "cd /app/backend && node dist/index.js & cd /app/client && PORT=3000 npm run start"
