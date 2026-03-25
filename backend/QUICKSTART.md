# Quick Start Guide

## Prerequisites
- PostgreSQL installed and running
- Node.js 18+ installed

## Setup Steps

1. **Install dependencies** (Already done ✅)
   ```bash
   npm install
   ```

2. **Configure database**
   - Edit `.env` file
   - Set `DATABASE_URL` to your PostgreSQL connection
   - Example: `postgresql://postgres:password@localhost:5432/women_safety_db?schema=public`

3. **Generate Prisma Client** (Already done ✅)
   ```bash
   npx prisma generate
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Seed database with test data**
   ```bash
   npm run prisma:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

Server will be running at: http://localhost:5000

## Test Credentials
- User: user@test.com / password123
- Volunteer: volunteer@test.com / password123
- Authority: authority@test.com / password123

## API Documentation
Visit: http://localhost:5000/api-docs

## Health Check
Visit: http://localhost:5000/health
