# Women Safety Monitoring App - Backend API

A comprehensive, production-ready backend system for the Women Safety Monitoring App built with Node.js, Express, TypeScript, PostgreSQL, and Socket.IO.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (User, Volunteer, Authority, Admin)
- **SOS Alert System**: Real-time emergency alerts with automatic notifications to emergency contacts, authorities, and volunteers
- **Incident Reporting**: Report incidents with photos, location tagging, and status tracking
- **Emergency Contacts**: Manage trusted contacts for emergency situations
- **Safe Route Mapping**: Safe/risk zone management and route safety scoring
- **Volunteer System**: Volunteer registration, incident response, and tracking
- **Real-time Features**: WebSocket support for live location tracking, alerts, and notifications
- **Multi-channel Notifications**: Email, SMS (Twilio), and in-app notifications
- **File Upload**: Support for incident photo uploads
- **Comprehensive Logging**: Winston-based logging system
- **API Documentation**: Swagger/OpenAPI ready

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- (Optional) Docker and Docker Compose

## 🛠️ Installation

### Option 1: Local Setup

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - Database URL
   - JWT secrets
   - SMTP credentials (for email)
   - Twilio credentials (for SMS, optional)

4. **Set up database**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate

   # Seed database with test data
   npm run prisma:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Server will start on `http://localhost:5000`

### Option 2: Docker Setup

1. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This will start PostgreSQL and the backend server.

2. **Run migrations**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npx prisma db seed
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/location` - Update user location
- `GET /api/users/settings` - Get user settings
- `PUT /api/users/settings` - Update user settings

### Emergency Contacts
- `GET /api/emergency-contacts` - List emergency contacts
- `POST /api/emergency-contacts` - Add emergency contact
- `PUT /api/emergency-contacts/:id` - Update emergency contact
- `DELETE /api/emergency-contacts/:id` - Delete emergency contact

### SOS Alerts
- `POST /api/sos/alert` - Trigger SOS alert
- `GET /api/sos/alerts` - Get alert history
- `GET /api/sos/alerts/:id` - Get specific alert
- `PUT /api/sos/alerts/:id/cancel` - Cancel active alert
- `GET /api/sos/active` - Get all active alerts (Authority)
- `PUT /api/sos/alerts/:id/resolve` - Resolve alert (Authority)

### Incident Reports
- `POST /api/incidents` - Create incident report (with photo upload)
- `GET /api/incidents` - List incidents (with filters)
- `GET /api/incidents/:id` - Get incident details
- `PUT /api/incidents/:id/status` - Update incident status (Authority)
- `DELETE /api/incidents/:id` - Delete incident

### Location Services
- `GET /api/locations/safe-zones` - Get nearby safe zones
- `GET /api/locations/risk-zones` - Get nearby risk zones
- `POST /api/locations/safe-zones` - Report safe zone
- `POST /api/locations/risk-zones` - Report risk zone
- `POST /api/locations/route-safety` - Calculate route safety

### Volunteer System
- `POST /api/volunteers/register` - Register as volunteer
- `GET /api/volunteers/incidents` - Get nearby incidents (Volunteer)
- `POST /api/volunteers/incidents/:id/accept` - Accept incident (Volunteer)
- `PUT /api/volunteers/incidents/:id/complete` - Mark incident complete (Volunteer)
- `GET /api/volunteers/stats` - Get volunteer statistics
- `PUT /api/volunteers/availability` - Update availability

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read

## 🔌 WebSocket Events

Connect to `ws://localhost:5000` with authentication token.

### Client → Server
- `location:update` - Update user location
- `sos:trigger` - Trigger SOS alert
- `incident:update` - Update incident status
- `volunteer:respond` - Volunteer responding to incident

### Server → Client
- `sos:alert` - SOS alert broadcast
- `incident:updated` - Incident status update
- `volunteer:responding` - Volunteer is responding
- `notification` - New notification
- `location:updated` - Location update confirmation

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📝 Database Schema

Key models:
- **User**: User accounts with roles
- **EmergencyContact**: Trusted contacts
- **SOSAlert**: Emergency alerts
- **IncidentReport**: Reported incidents
- **Location**: Geographic data
- **SafeZone/RiskZone**: Community-marked areas
- **Volunteer**: Volunteer profiles
- **Authority**: Authority profiles
- **Notification**: User notifications

## 🔐 Environment Variables

See `.env.example` for all required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `SMTP_*` - Email configuration
- `TWILIO_*` - SMS configuration (optional)
- `CLIENT_URL` - Frontend URL for CORS

## 🚀 Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

4. **Start production server**
   ```bash
   npm start
   ```

## 📊 Monitoring & Logs

Logs are stored in the `logs/` directory:
- `error.log` - Error logs
- `combined.log` - All logs

## 🤝 Test Credentials

After running the seed script:

- **User**: user@test.com / password123
- **Volunteer**: volunteer@test.com / password123
- **Authority**: authority@test.com / password123

## 🛡️ Security Features

- Helmet.js for security headers
- Rate limiting
- JWT authentication
- Password hashing with bcrypt
- Input validation with Zod
- CORS configuration
- SQL injection protection (Prisma ORM)

## 📄 License

MIT

## 👥 Support

For issues and questions, please open an issue in the repository.
