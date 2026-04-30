FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_PAYSTACK_PUBLIC_KEY
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_PAYSTACK_PUBLIC_KEY=${VITE_PAYSTACK_PUBLIC_KEY}

# Debug: surface what build args actually arrived. Visible in Dokploy build logs.
# Empty values here = build arg was not passed correctly from the platform UI.
RUN echo "=== BUILD-TIME VARIABLES ===" \
    && echo "VITE_API_URL=[${VITE_API_URL}]" \
    && echo "VITE_PAYSTACK_PUBLIC_KEY=[${VITE_PAYSTACK_PUBLIC_KEY:+set}${VITE_PAYSTACK_PUBLIC_KEY:-MISSING}]" \
    && echo "==========================="

RUN npm run build

# Sanity-check: the production base URL must end up inlined in the bundle.
# Fails the build if Vite fell back to the dev placeholder, so a misconfigured
# Build Arg can never reach production silently.
RUN if grep -q "localhost:8000/api" dist/assets/index-*.js; then \
      echo "ERROR: bundle contains localhost:8000/api fallback — VITE_API_URL was empty at build time" >&2; \
      exit 1; \
    fi


FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
