# Secondary API target: Google Cloud Run. Build from repository root:
# docker build -f apps/api/Dockerfile -t okard-api .
FROM node:22-slim
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate
COPY package.json pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ai-gateway/package.json packages/ai-gateway/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --no-frozen-lockfile
COPY packages/shared packages/shared
COPY packages/ai-gateway packages/ai-gateway
COPY apps/api apps/api
RUN pnpm --filter @okard/shared build && pnpm --filter @okard/ai-gateway build && pnpm --filter @okard/api build
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "apps/api/dist/server.js"]
