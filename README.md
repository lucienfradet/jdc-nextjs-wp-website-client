# SITE WEB - LE JARDIN DES CHEFS

Documentation for the website of [jardindeschefs.ca](https://jardindeschefs.ca)

## Technology Stack

- Frontend: Next.js 13+ (App Router), React 18
- Content Management: Headless WordPress with WooCommerce
- Payment Processing: Stripe
- Styling: CSS Modules
- Deployment: Digital Ocean Droplet with Docker Compose
- Load Balancer: Traefik
- Container Management: Watchtower for automatic updates
- Monitoring: Custom health monitoring with ntfy notifications

### Frontend

- [Next.js](https://nextjs.org)
- [mui](https://mui.com/) components
- [Stripe](https://dashboard.stripe.com/) Payment Gateway integration and Webhooks

### Backend

- [WordPress](https://wordpress.org/) as headless CMS
- MySQL/Prisma local Database
- WordPress/WooCommerce
- Redis for caching and session management

### Deployment & Infrastructure

- **Docker Compose**: Multi-container orchestration
- **Traefik**: Load balancer with health checks and sticky sessions
- **Watchtower**: Automatic container updates with rolling deployments
- **GitHub Actions**: CI/CD pipeline with container registry
- **Digital Ocean Droplet**: Production hosting
- **Automated backups**: Weekly encrypted database backups to Nextcloud

## Architecture Overview

### Production Deployment Stack

The production environment uses a sophisticated deployment stack designed for high availability and zero-downtime updates:

#### Load Balancing & High Availability
- **Traefik Load Balancer**: Routes traffic between two Next.js instances
- **Sticky Sessions**: Ensures user session consistency during updates
- **Health Checks**: Continuous monitoring of service availability
- **Rolling Updates**: Zero-downtime deployments with Watchtower

#### Container Orchestration
- **Two Next.js Instances**: `nextjs-1` and `nextjs-2` for redundancy
- **Database Separation**: WordPress MySQL and Orders MySQL (separate containers)
- **Redis Cache**: Shared caching layer for both Next.js instances
- **Backup Services**: Automated cron jobs for database backups

#### Security Implementation
Security headers are implemented in `middleware.js` and include:
- **Content Security Policy (CSP)**: Comprehensive policy restricting resource loading
- **CORS Configuration**: Restricted to allowed origins with credentials support
- **Security Headers**: XSS protection, clickjacking prevention, MIME sniffing protection
- **HSTS**: Enforced HTTPS in production with preload directive
- **Feature Policy**: Restricted permissions for camera, microphone, geolocation

## Development & Deployment Workflow

### Branch Strategy & Update Process

The site uses a three-branch workflow for safe deployments:

#### 1. Development Branch (`dev`)
- Feature development and initial testing
- Local development environment
- Non-HTTPS fetching allowed for development

#### 2. Test Branch (`test`)
- Pre-production testing
- Local build testing with production-like environment
- Validates container builds before production

#### 3. Main Branch (`main`)
- Production deployments
- Triggers GitHub Actions CI/CD
- Automatic container building and deployment

### Deployment Process

1. **Develop Features**:
   ```bash
   git checkout dev
   # Implement features
   git commit -m "Add new feature"
   git push origin dev
   ```

2. **Test Locally**:
   ```bash
   git checkout test
   git merge dev
   # Test local build
   npm run build
   npm run start -- -H [HOST IP IN next.config.mjs] -p [PORT in next.config.mjs]
   ```

3. **Deploy to Production**:
   ```bash
   git checkout main
   git merge test
   git push origin main
   ```

4. **Monitor Deployment**:
   - GitHub Actions builds and pushes new container to GHCR
   - Watchtower detects new image and performs rolling update
   - Health monitoring ensures successful deployment
   - Notifications sent via ntfy for deployment status

### GitHub Actions CI/CD Pipeline

The CI/CD pipeline (`/.github/workflows/build-and-push.yml`) automatically:

1. **Builds Docker Image**: On push to main branch
2. **Injects Build Arguments**: Environment variables for Next.js build
3. **Pushes to Registry**: GitHub Container Registry (GHCR)
4. **Tags Appropriately**: Latest tag for main branch, PR tags for pull requests

### Watchtower Rolling Updates

Watchtower provides zero-downtime deployments through:

- **Health Check Validation**: Ensures other instance is healthy before updating
- **Rolling Restart**: Updates one instance at a time
- **Lifecycle Hooks**: Pre and post-update health verification
- **Failure Recovery**: Automatic rollback if health checks fail
- **Notification Integration**: Status updates via ntfy

## Monitoring & Health Checks

### Automated Health Monitoring

The monitoring system (`/monitoring/health-check.sh`) provides:

- **Service Health Checks**: Monitors Next.js instances and Traefik
- **Failure Detection**: Tracks consecutive failures before alerting
- **Recovery Notifications**: Alerts when services come back online
- **Critical Alerts**: Urgent notifications for complete service outages
- **ntfy Integration**: Real-time notifications to configured channels

### Monitored Services

- **Next.js Instance 1**: `http://nextjs-1:3000/api/health`
- **Next.js Instance 2**: `http://nextjs-2:3000/api/health`
- **Traefik Load Balancer**: `http://traefik:6969/ping`

### Alert Levels

- **Low Priority**: Service startup notifications
- **Default**: Service recovery notifications
- **High Priority**: Individual service failures
- **Urgent**: Critical infrastructure failures (load balancer, all instances down)

## WordPress & Cron Management

### WordPress Cron Bypass

WordPress default cron relies on site visits, which is unreliable. Our implementation bypasses this with:

#### Internal Cron Setup (`/backend/wordpress-cron-setup/`)
- **WP-CLI Integration**: Direct cron execution via WP-CLI
- **Fallback HTTP Method**: Direct HTTP calls to wp-cron.php
- **System Cron**: Linux cron running inside WordPress container
- **Multiple Execution Methods**: Ensures cron reliability

#### Cron Schedule
- **Primary**: WP-CLI cron every 5 minutes
- **Fallback**: HTTP cron every 10 minutes
- **External Backup**: Host-level script available if needed

### Database Backup & Cleanup Cron

The backup system (`/backend/cron/`) provides:

#### Automated Database Backups
- **WordPress Database**: Daily backups at 2 AM EST
- **Compression**: XZ compression for optimal storage
- **Encryption**: GPG encryption with admin@jardindeschefs.ca key
- **Remote Storage**: Automatic upload to Nextcloud
- **Cleanup**: Local files removed after successful upload

#### Cleanup Operations
- **Expired Payment Intents**: Hourly cleanup via Next.js API
- **Old Backup Files**: Weekly cleanup of files older than 7 days
- **Database Optimization**: Regular maintenance tasks

#### Backup Security
- **GPG Encryption**: All backups encrypted before storage
- **Secure Transfer**: Encrypted uploads to Nextcloud
- **Access Control**: Restrictive file permissions (umask 077)
- **Key Management**: Public key stored in `/backend/cron/keys/`

## Environment Variables & Configuration

### Variable Distribution Strategy

Environment variables are strategically distributed across different systems for security and functionality:

#### GitHub Repository Secrets (`Settings > Secrets and variables > Actions`)
Sensitive `NEXT_PUBLIC_*` variables that must be baked into the container build:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

#### GitHub Actions Workflow (`.github/workflows/build-and-push.yml`)
Non-sensitive `NEXT_PUBLIC_*` variables defined directly in the workflow:
```yaml
NEXT_PUBLIC_WORDPRESS_HOSTNAME=wordpress.jardindeschefs.ca
NEXT_PUBLIC_WORDPRESS_BASE_URL=https://wordpress.jardindeschefs.ca/
NEXT_PUBLIC_SITE_URL=https://jardindeschefs.ca
NEXT_PUBLIC_SSL_IGNORE=false
```

#### Backend Environment (`/backend/.env`)
Docker orchestration and sensitive runtime variables:
- Database credentials
- API keys for services
- Redis configuration
- Backup system credentials
- Webhook secrets

### Important Notes on NEXT_PUBLIC Variables

**Critical**: All `NEXT_PUBLIC_*` variables must be available at **build time** and are baked into the container. These cannot be changed at runtime and require a new container build to update.

**Security Consideration**: `NEXT_PUBLIC_*` variables are exposed to the client-side code, so only use them for values that are safe to be public.

## API Documentation

### Products API

```GET /api/products``` - List all products
```GET /api/products/[id]``` - Get a specific product

#### Pickup Locations API

```GET /api/point_de_chute``` - List all pickup locations

#### Tax Calculation API

```POST /api/calculate-taxes``` - Calculate taxes for cart items

```
Request: { items: [], province: "QC", shipping: 15 }
Response: Tax breakdown and totals
```

#### Orders API

```POST /api/orders/create-pending``` - Create a pending order
```POST /api/orders/update-succeeded``` - Update order status to succeeded
```POST /api/orders/update-failed``` - Update order status to failed

#### Stripe API

```POST /api/stripe/create-payment-intent``` - Create a Stripe payment intent
```POST /api/stripe/webhook``` - Handle Stripe webhooks for payment events

#### Health & Maintenance APIs

```GET /api/health``` - Service health check endpoint
```GET /api/cron/cleanup-expired-intents``` - Cleanup expired payment intents

## Local Development

### Development Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd <repository-name>

# Switch to development branch
git checkout dev

# Start development environment
sudo docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# In separate terminal, start Next.js development server
npm run dev

# Start Stripe webhook listener
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Database Management

#### Initial Database Setup

Update `package.json` for development environment:
```json
"scripts": {
    "prisma:dev": "dotenv -e .env.development -- npx prisma"
}
```

```bash
# Initialize Prisma (first-time setup)
npm run prisma:dev -- generate
npm run prisma:dev -- migrate dev --name initial_schema
```

#### Database Updates

**IMPORTANT**: When changing schema, data migration is not auto-managed if fields are **deleted** or **renamed**! Proper data management should be created manually in `/prisma/migrations/[timestamp]_NAME_OF_THE_CHANGE/migration.sql`

```bash
# Update schema and create migration
npm run prisma:dev -- migrate dev --name NAME_OF_THE_CHANGES --create-only

# !! Edit migration file if needed !!

# Apply the migrations
npm run prisma:dev -- migrate dev

# Regenerate Prisma client
npm run prisma:dev -- generate
```

#### Database Inspection
```bash
# Start Prisma Studio (web interface on port 5555)
npm run prisma:dev -- studio
```

### Production Database Updates

```bash
# Deploy migrations to production
npx prisma migrate deploy
```

**Important Differences Between Commands**:
- `migrate dev`: Development - generates new migrations and applies them
- `migrate deploy`: Production - only applies existing migrations
- Always run `migrate dev` in development first, commit migrations, then run `migrate deploy` in production

## Production Deployment

### Production Environment
```bash
# Start production environment
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### File Permissions
```bash
# Secure environment files
chmod 600 .env*
```

### Server Security
- **UFW**: Uncomplicated Firewall configuration
- **fail2ban**: Intrusion prevention system

## Maintenance and Updates

### Content Updates
Content is managed through the WordPress backend:

1. Log in to the WordPress admin panel
2. Update pages, products, and settings
3. The Next.js frontend will fetch the updated content

### Adding New Products

1. Add products in the WooCommerce dashboard
2. Configure product details, pricing, and images
3. Set the shipping class (standard or pickup only)
4. Set tax status (taxable or exempt)

### Adding Pickup Locations

1. In WordPress, edit the "point-de-chute" page
2. Add new pickup locations with addresses and instructions
3. The frontend will fetch and display the updated locations

### Modifying Tax Rates

1. In the WooCommerce dashboard, go to Settings > Tax
2. Update tax rates for different provinces
3. The frontend will use these rates for calculations

## Future Implementations

### Shipping Calculator
The `/lib/shipping/ShippingCalculator` has a basic implementation that checks for province flat rates and uses a default $15 rate. For full implementation, discuss requirements with JDC.

### Next.js Cron Integration
Route in `./app/api/cron/cleanup-expired-intents/route.js` cleans up expired ValidatedPaymentIntent records, called by the cron container using `CRON_SECRET_KEY`.

## Releases

**Latest production build**: v1.3 (19/01/26)

### Release Process

1. **Feature Development**: Implement in `dev` branch
2. **Testing**: Merge to `test` branch and validate a build locally
3. **Production**: Merge to `main` branch
4. **Automated Deployment**: GitHub Actions + Watchtower handle the rest
5. **Monitoring**: Health checks and notifications ensure successful deployment
