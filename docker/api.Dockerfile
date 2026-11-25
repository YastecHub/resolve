FROM node:24-slim AS build
RUN npm install -g pnpm@11.25.0
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api build
RUN pnpm --filter api deploy --prod --legacy /out

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out/package.json ./package.json
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION PORT=9000
EXPOSE 9000
USER node
CMD ["node", "dist/main.js"]
