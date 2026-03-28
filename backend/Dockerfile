# Use a more complete Debian-based image for better compatibility
FROM node:20-bookworm

WORKDIR /app

# Install system dependencies for Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for tsc)
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client and Build TypeScript
RUN npx prisma generate
RUN npm run build

# Create uploads and logs directories
RUN mkdir -p uploads logs

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start server with a more robust command
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
