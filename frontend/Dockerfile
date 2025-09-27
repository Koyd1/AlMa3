# syntax=docker/dockerfile:1
FROM node:22-alpine

WORKDIR /app

# Устанавливаем зависимости (используем lockfile, если есть)
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent

# Копируем исходники
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
