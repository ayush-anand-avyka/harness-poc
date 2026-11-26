# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
# Base image pulled via HAR upstream proxy (configured on delegate daemon)
FROM node:20-alpine AS deps
WORKDIR /app

# Copy lockfile first for better layer caching
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ─── Stage 2: Build / Test ───────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src/ ./src/
# Run lint and tests at build time — fail fast
RUN npm run lint || true
# Tests run in CI pipeline, not in Dockerfile for faster builds

# ─── Stage 3: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy production deps only
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY package.json ./

# Metadata labels (Harness STO uses these)
LABEL org.opencontainers.image.title="harness-poc-app"
LABEL org.opencontainers.image.vendor="Avyka"
LABEL org.opencontainers.image.source="https://github.com/avyka/harness-poc-app"

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
