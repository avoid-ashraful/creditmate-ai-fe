FROM node:20-bookworm-slim AS build

WORKDIR /app

ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

# Validate that the API base URL is a public HTTPS URL at build time.
RUN node -e 'const url = new URL(process.env.REACT_APP_API_BASE_URL); const hostname = url.hostname.toLowerCase(); if (url.protocol !== "https:" || hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "::1" || hostname.startsWith("127.")) { console.error("REACT_APP_API_BASE_URL must be a public HTTPS API base URL"); process.exit(1); }'

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

RUN npm run build

FROM node:20-bookworm-slim AS runtime

WORKDIR /app
ENV PORT=3000
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app
EXPOSE 3000
CMD ["npx", "serve", "-s", "build", "-l", "3000"]
