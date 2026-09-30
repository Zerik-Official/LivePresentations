# Builds the React frontend and serves it with Nginx, which also proxies the backend.
# Build context: repository root.

FROM node:22-alpine AS build
WORKDIR /app
COPY apps/frontend/package*.json ./
RUN npm ci --no-audit
COPY apps/frontend/ ./
# Empty VITE_BACKEND_URL: the API is called on the same origin (/api, /ws, /static)
ARG VITE_TURNSTILE_PUBLIC_KEY=""
ENV VITE_BACKEND_URL="" \
    VITE_TURNSTILE_PUBLIC_KEY=$VITE_TURNSTILE_PUBLIC_KEY
RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/aws/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
