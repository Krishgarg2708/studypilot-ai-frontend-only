# StudyPilot AI — Frontend (Vite + React)
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build

# ---- Production stage ----
FROM nginx:alpine AS runner

# Copy built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config: route all requests to index.html for React Router,
# and proxy /api to the backend so the frontend and API share a single origin.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
