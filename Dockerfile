FROM node:24-bookworm-slim AS build

WORKDIR /app

ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

# Validate that the API base URL is a public HTTPS URL at build time.
RUN node -e 'const url = new URL(process.env.REACT_APP_API_BASE_URL); const hostname = url.hostname.toLowerCase(); if (url.protocol !== "https:" || hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "::1" || hostname.startsWith("127.")) { console.error("REACT_APP_API_BASE_URL must be a public HTTPS API base URL"); process.exit(1); }'

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

# Runtime: unprivileged nginx serving the static build, mirroring the
# Kubernetes frontend. (Previously this stage ran `serve`, whose
# serve-handler -> minimatch chain carries an unpatched moderate DoS
# advisory, GHSA-g3hv-75wg-m249; nginx removes that dependency entirely.)
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 3000
