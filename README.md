# O3L - One Ocean One Life

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flokesh-061106%2FOne-Ocean-One-Life-loki&root-directory=apps%2Fweb)

A cross-platform ocean and coastal community platform connecting fishermen, coastal communities, researchers, NGOs, vendors, and government resources across Tamil Nadu's coastline.

## Features

### Core Features
- **Authentication**: Email/Password, Mobile OTP, Google OAuth, Apple Sign-In
- **User Management**: 14 user roles with RBAC permissions
- **Profile System**: Location privacy with 6 precision levels
- **Emergency System**: SOS, offline contacts, maritime safety

### Ocean Science
- **Ocean Sound Recording**: Audio capture with metadata, verification workflow
- **Marine Mammal Sightings**: AI-assisted species identification
- **Guide - Learn the Ocean**: Species database with Tamil names
- **Research Data Platform**: Data export, licensing, API access

### Community
- **Educational Content**: Articles, blogs, tutorials in Tamil & English
- **Community Posts**: Photo/video diary, visibility controls
- **Events**: Cleanup, education, research events
- **Recognition & Scoring**: Gamification, leaderboards, awards

### Commerce
- **Marketplace**: Products with contribution discounts
- **Data Marketplace**: Sell verified ocean data
- **Ecotourism**: Beaches, tourism opportunities
- **Circular Economy**: Business ideas, government schemes

### Technical
- **Offline-First**: SQLite sync, emergency data caching
- **Push Notifications**: Firebase Cloud Messaging
- **Media Processing**: Image thumbnails, audio compression
- **Payment Integration**: Razorpay (India), Stripe (international)

## Tech Stack

### Backend
- **Framework**: Django 5.2 + DRF
- **Database**: PostgreSQL 17 + PostGIS 3.6
- **Cache**: Redis 7
- **Task Queue**: Celery
- **Auth**: SimpleJWT + Mobile OTP

### Mobile
- **Framework**: React Native 0.86 + Expo SDK 57
- **State**: Zustand
- **Offline**: SQLite
- **Maps**: Leaflet (WebView)

### Web
- **Framework**: Next.js 16.3
- **UI**: Tailwind CSS 4 + Radix UI
- **Maps**: MapLibre GL
- **State**: TanStack Query

### Infrastructure
- **Container**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry + OpenTelemetry

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.12+
- Node.js 20+

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/o3l.git
cd o3l
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Start services:
```bash
docker-compose up -d
```

4. Run migrations:
```bash
docker-compose exec api python manage.py migrate
```

5. Seed data:
```bash
docker-compose exec api python manage.py seed_zones
docker-compose exec api python manage.py seed_cms
```

6. Create superuser:
```bash
docker-compose exec api python manage.py createsuperuser
```

7. Access applications:
- API: http://localhost:8000/api/v1/
- Web: http://localhost:3000
- Admin: http://localhost:8000/admin/

## API Endpoints

### Authentication
- `POST /api/v1/accounts/register/` - Register new user
- `POST /api/v1/accounts/login/` - Login with email/password
- `POST /api/v1/accounts/otp/request/` - Request OTP
- `POST /api/v1/accounts/otp/verify/` - Verify OTP
- `POST /api/v1/accounts/oauth/google/` - Google login
- `POST /api/v1/accounts/oauth/apple/` - Apple login
- `POST /api/v1/accounts/logout/` - Logout
- `POST /api/v1/accounts/logout-all/` - Logout from all devices

### Guides
- `GET /api/v1/guides/categories/` - List categories
- `GET /api/v1/guides/species/` - List species
- `POST /api/v1/guides/species/` - Create species

### Education
- `GET /api/v1/education/categories/` - List categories
- `GET /api/v1/education/posts/` - List posts
- `POST /api/v1/education/posts/` - Create post

### Contributions
- `GET /api/v1/contributions/` - List contributions
- `POST /api/v1/contributions/` - Create contribution
- `POST /api/v1/contributions/{id}/review/` - Review contribution

### Community
- `GET /api/v1/community/posts/` - List posts
- `POST /api/v1/community/posts/` - Create post
- `GET /api/v1/community/events/` - List events
- `POST /api/v1/community/events/{id}/join/` - Join event

### Marketplace
- `GET /api/v1/marketplace/categories/` - List categories
- `GET /api/v1/marketplace/products/` - List products
- `POST /api/v1/marketplace/orders/` - Create order

### Maps
- `GET /api/v1/maps/observations/` - Map observations
- `GET /api/v1/maps/hotspots/` - Ocean hotspots
- `GET /api/v1/maps/emergency/` - Emergency contacts

### Recognition
- `GET /api/v1/recognition/leaderboard/` - Leaderboard
- `GET /api/v1/recognition/scores/me/` - My score
- `GET /api/v1/recognition/awards/` - Awards

### Emergency
- `GET /api/v1/emergency/profile/` - Emergency profile
- `GET /api/v1/emergency/offline-data/` - Offline data
- `POST /api/v1/emergency/contacts/` - Add contact

## Configuration

### Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `SECRET_KEY` - Django secret key
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `TWILIO_*` - SMS OTP configuration
- `GOOGLE_CLIENT_*` - Google OAuth
- `FIREBASE_*` - Push notifications
- `RAZORPAY_*` - Payment (India)
- `STRIPE_*` - Payment (International)

### User Roles

| Role | Description |
|------|-------------|
| SUPER_ADMIN | Full system access |
| ADMIN | Administrative access |
| MODERATOR | Content moderation |
| SCIENTIFIC_VALIDATOR | Data verification |
| RESEARCHER | Research access |
| NGO | NGO features |
| COMMUNITY_ORGANIZATION | Community features |
| FISHERMAN | Fishermen features |
| COMMUNITY_MEMBER | Basic member |
| VENDOR | Marketplace selling |
| TOURISM_PROVIDER | Ecotourism features |
| EDUCATOR | Educational content |
| VOLUNTEER | Volunteer features |
| GUEST | Public read-only |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@o3l.org or create an issue on GitHub.
