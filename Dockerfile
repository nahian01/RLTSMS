# ==============================================================================
# RLTSMS - RISEUP LABS TOOLS & SERVICES MANAGEMENT SYSTEM
# MULTI-STAGE ENTERPRISE DOCKERFILE
# ==============================================================================

# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies (legacy peer deps required for modern Vite & Tailwind v4)
RUN npm install --legacy-peer-deps

# Copy source code and assets
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Production Backend API Runner
FROM node:20-alpine AS api

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev

# Copy server sources and database migrations
COPY server ./server
COPY src/types ./src/types
COPY src/data ./src/data
COPY tsconfig*.json ./

# Install tsx globally or locally to execute typescript server natively
RUN npm install -g tsx

EXPOSE 5000

CMD ["tsx", "server/index.ts"]

# Stage 3: Production Frontend Nginx Web Server
FROM nginx:alpine AS web

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
