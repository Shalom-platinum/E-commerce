# Frontend Build Stage
FROM node:18-alpine as builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Set environment variables for the build
ENV CI=false

# Build and check for errors
RUN npm run build || (echo "Build failed, listing directory:" && ls -la && exit 1)

# Production Stage
FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
