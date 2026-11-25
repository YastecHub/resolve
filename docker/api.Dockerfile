FROM node:24-slim AS build
RUN npm install -g pnpm@11.25.0
WORKDIR /repo
COPY . .
# postinstall runs `prisma generate`, which build needs.
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api build
RUN pnpm --filter api deploy --prod --legacy /out

FROM node:24-slim
# Prisma's migration engine links against OpenSSL, which the slim image leaves out.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
RUN mkdir -p /data/case-files && chown node:node /data/case-files
WORKDIR /app
COPY --from=build /out/package.json ./package.json
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/prisma ./prisma
COPY --from=build /repo/apps/api/prisma.config.ts ./prisma.config.ts
COPY docker/api-entrypoint.sh /usr/local/bin/api-entrypoint
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION PORT=9000
EXPOSE 9000
USER node
ENTRYPOINT ["api-entrypoint"]
CMD ["node", "dist/main.js"]
