FROM node:22.14.0-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/mg-construction-journal/package.json ./apps/mg-construction-journal/
COPY apps/mg-construction-journal-backend/package.json ./apps/mg-construction-journal-backend/
COPY apps/mg-construction-journal-backend/prisma/ ./apps/mg-construction-journal-backend/prisma/
COPY apps/mg-construction-journal-backend/src/ ./apps/mg-construction-journal-backend/src/
COPY apps/mg-construction-journal-backend/prisma.config.ts ./apps/mg-construction-journal-backend/
COPY apps/mg-construction-journal-backend/tsconfig.docker.json ./apps/mg-construction-journal-backend/
COPY packages/ ./packages/

RUN --mount=type=cache,target=/root/.npm \
    npm ci --include-workspace-root

RUN sed -i 's/provider = "sqlite"/provider = "postgresql"/' apps/mg-construction-journal-backend/prisma/schema.prisma

RUN npx prisma generate --schema=apps/mg-construction-journal-backend/prisma/schema.prisma

FROM node:22.14.0-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV DB_PROVIDER=postgresql
ENV TSX_TSCONFIG_PATH=tsconfig.docker.json

EXPOSE 8001

CMD cd apps/mg-construction-journal-backend && \
    npx prisma db push --accept-data-loss && \
    npx tsx src/seed/seed-docker.ts && \
    npx tsx src/main.ts
