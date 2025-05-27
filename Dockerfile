FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Accept build arguments
ARG NEXT_PUBLIC_WORDPRESS_HOSTNAME
ARG NEXT_PUBLIC_WORDPRESS_BASE_URL
ARG NEXT_PUBLIC_WORDPRESS_API_URL
ARG NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SSL_IGNORE
ARG DATABASE_URL
ARG REDIS_URL

# Set as environment variables for the build process
ENV NEXT_PUBLIC_WORDPRESS_HOSTNAME=$NEXT_PUBLIC_WORDPRESS_HOSTNAME
ENV NEXT_PUBLIC_WORDPRESS_BASE_URL=$NEXT_PUBLIC_WORDPRESS_BASE_URL
ENV NEXT_PUBLIC_WORDPRESS_API_URL=$NEXT_PUBLIC_WORDPRESS_API_URL
ENV NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL=$NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SSL_IGNORE=$NEXT_PUBLIC_SSL_IGNORE
ENV DATABASE_URL=$DATABASE_URL
ENV REDIS_URL=$REDIS_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client before building
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install curl for health checks
RUN apk add --no-cache curl

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Use npm start which will use your package.json start script
CMD ["sh", "-c", "npx prisma migrate deploy && exec npm start"]
