# ── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
# Build args allow injecting env vars at build time
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_APP_NAME=EventCraft
ARG VITE_ENVIRONMENT=production
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_ENVIRONMENT=$VITE_ENVIRONMENT
RUN pnpm build

# ── Stage 2: Serve with Nginx ────────────────────────────────
FROM nginx:1.25-alpine AS runner
# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf
# Copy our SPA-aware nginx config
COPY infra/nginx/nginx.conf /etc/nginx/conf.d/default.conf
# Copy Vite build output
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
