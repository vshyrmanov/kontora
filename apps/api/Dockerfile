# Збирається з кореня репозиторію: docker build -f apps/api/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
RUN npm ci --workspace @kontora/api --workspace @kontora/contracts --include-workspace-root
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN npm run build -w @kontora/contracts && npm run build -w @kontora/api \
  && npm prune --omit=dev --workspace @kontora/api --workspace @kontora/contracts

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/packages/contracts/package.json packages/contracts/
COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY --from=build /app/apps/api/package.json apps/api/
COPY --from=build /app/apps/api/dist apps/api/dist
USER node
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
