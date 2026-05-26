FROM node:22.14.0-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY apps/mg-construction-journal-backend/package.json ./apps/mg-construction-journal-backend/
COPY apps/mg-construction-journal/ ./apps/mg-construction-journal/
COPY packages/ ./packages/

RUN --mount=type=cache,target=/root/.npm \
    npm ci --include-workspace-root

RUN npm run build -w mg-construction-journal

FROM nginx:alpine AS runner

COPY --from=builder /app/apps/mg-construction-journal/dist/ /usr/share/nginx/html

COPY apps/mg-construction-journal/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
