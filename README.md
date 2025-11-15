# Flo Package Registry

A modern, developer-first web package registry with a public catalog and authenticated admin panel. Built with React (TypeScript) frontend and Node.js/Express (TypeScript) backend, using PostgreSQL and S3-compatible storage.

## Features

### Public Features
- **Searchable Package Catalog**: Browse and search packages with a clean, intuitive interface
- **Package Detail Pages**: View package information, README, and available releases
- **Release Pages**: See release notes, download assets, and get install commands
- **Multi-Platform Support**: Assets tagged by OS/platform/architecture
- **One-Line Installers**: Auto-generated install scripts with checksum verification
- **Dark Mode**: Developer-friendly dark theme (default) with light mode option
- **Mobile-Friendly**: Responsive design that works on all devices

### Admin Features
- **Repository Import**: Import packages from GitHub, GitLab, or Bitbucket
- **Package Management**: Create and update packages
- **Release Management**: Create releases with Markdown notes, draft/publish workflow
- **Asset Upload**: Upload binaries, tag by platform/OS/arch
- **Asset Hosting**: S3/MinIO storage with signed download URLs
- **Checksum Generation**: Automatic SHA256 computation and verification
- **Audit Logging**: Track all admin actions

### Security
- **JWT Authentication**: Secure admin endpoints
- **SSRF Protection**: Allowlist for repository imports
- **Markdown Sanitization**: Safe rendering of user content
- **File Type Validation**: Restrict uploads to safe file types
- **Rate Limiting**: Protect against abuse
- **Checksum Verification**: SHA256 for all assets

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- React Router for navigation
- Axios for API calls
- React Markdown for rendering
- Responsive CSS with CSS variables for theming

**Backend:**
- Node.js with Express and TypeScript
- PostgreSQL for data storage
- MinIO/S3 for asset storage
- JWT for authentication
- bcrypt for password hashing
- Rate limiting and security middleware

## Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose (for local development)
- npm or yarn

### Local Development with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/FoundationINCCorporateTeam/PackageManager.git
   cd PackageManager
   ```

2. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This starts:
   - PostgreSQL on port 5432
   - MinIO on port 9000 (API) and 9001 (Console)
   - Backend API on port 3000
   - Frontend on port 3001

3. **Run database migrations**
   ```bash
   cd backend
   npm run migrate
   ```

4. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

### Manual Setup (Without Docker)

1. **Start PostgreSQL**
   ```bash
   # Install PostgreSQL 15+ and create database
   createdb flo_registry
   ```

2. **Start MinIO**
   ```bash
   # Download and run MinIO
   minio server /data --console-address ":9001"
   ```

3. **Setup Backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   npm install
   npm run migrate
   npm run dev
   ```

4. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Usage Guide

### 1. Register an Account

1. Navigate to http://localhost:3001
2. Click "Register" in the header
3. Create your account (first user can be made admin via database)

### 2. Import a GitHub Repository

1. Login and navigate to Admin Dashboard
2. Click "Import Package"
3. Enter a public GitHub repository URL (e.g., `https://github.com/user/repo`)
4. Optionally provide a GitHub token for higher rate limits
5. Review the preview and click "Create Package"

Example repositories to try:
- https://github.com/golang/go
- https://github.com/microsoft/vscode

### 3. Create a Release

1. In Admin Dashboard, go to "Manage Packages"
2. Find your package and click "Create Release"
3. Enter version (e.g., `1.0.0`)
4. Add release notes in Markdown
5. Choose "Draft" or "Published"
6. Click "Create Release"

### 4. Upload Assets

1. After creating a release, click "Upload Asset"
2. Select your binary file
3. Tag with platform (e.g., `linux`, `windows`, `darwin`)
4. Tag with OS (e.g., `ubuntu`, `debian`)
5. Tag with architecture (e.g., `x64`, `arm64`)
6. Click "Upload"

### 5. Test Install Command

1. Navigate to the release page
2. Copy the platform-specific install command
3. Run it in your terminal:

   ```bash
   # Linux/macOS
   curl -fsSL http://localhost:3000/api/v1/packages/owner/name/install/1.0.0/linux/x64 | sh
   
   # Windows PowerShell
   iwr -useb http://localhost:3000/api/v1/packages/owner/name/install/1.0.0/windows/x64 | iex
   
   # Using mn CLI
   mn add owner/name@1.0.0
   ```

The install script will:
- Download the asset
- Verify SHA256 checksum
- Extract/install to appropriate location

## API Documentation

### Public API

#### GET /api/v1/packages
Search and list packages
```bash
curl "http://localhost:3000/api/v1/packages?search=example&page=1&limit=20"
```

#### GET /api/v1/packages/:owner/:name
Get package details
```bash
curl "http://localhost:3000/api/v1/packages/myorg/mypackage"
```

#### GET /api/v1/packages/:owner/:name/releases
Get package releases
```bash
curl "http://localhost:3000/api/v1/packages/myorg/mypackage/releases"
```

#### GET /api/v1/packages/:owner/:name/releases/:version
Get specific release with assets
```bash
curl "http://localhost:3000/api/v1/packages/myorg/mypackage/releases/1.0.0"
```

#### GET /api/v1/packages/:owner/:name/releases/:version/assets/:id
Download asset (redirects to signed URL)
```bash
curl -L "http://localhost:3000/api/v1/packages/myorg/mypackage/releases/1.0.0/assets/1" -o file
```

#### GET /api/v1/packages/:owner/:name/install/:version/:platform/:arch
Get install script
```bash
curl "http://localhost:3000/api/v1/packages/myorg/mypackage/install/1.0.0/linux/x64"
```

### Admin API

All admin endpoints require authentication via JWT token in the `Authorization: Bearer <token>` header.

#### POST /api/v1/auth/register
Register a new user
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"password123"}'
```

#### POST /api/v1/auth/login
Login and get JWT token
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

#### POST /api/v1/admin/import
Import repository metadata
```bash
curl -X POST http://localhost:3000/api/v1/admin/import \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl":"https://github.com/user/repo"}'
```

#### POST /api/v1/admin/packages
Create a package
```bash
curl -X POST http://localhost:3000/api/v1/admin/packages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"owner":"myorg","name":"mypackage","description":"My package"}'
```

#### POST /api/v1/admin/packages/:packageId/releases
Create a release
```bash
curl -X POST http://localhost:3000/api/v1/admin/packages/1/releases \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"version":"1.0.0","releaseNotes":"Initial release","status":"published"}'
```

#### POST /api/v1/admin/releases/:releaseId/assets
Upload an asset
```bash
curl -X POST http://localhost:3000/api/v1/admin/releases/1/assets \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/binary" \
  -F "platform=linux" \
  -F "os=ubuntu" \
  -F "arch=x64"
```

## Development

### Backend

```bash
cd backend

# Install dependencies
npm install

# Run migrations
npm run migrate

# Start dev server (with auto-reload)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Testing

### Run Backend Tests
```bash
cd backend
npm test
```

Tests include:
- Repository import validation (SSRF protection)
- Install command generation
- MIME type validation
- Checksum verification

### Integration Test Scenario

1. **Setup**: Start all services
2. **Import**: Import a GitHub repository with releases
3. **Create Release**: Create a new release via API
4. **Upload Asset**: Upload a test binary
5. **Publish**: Change release status to published
6. **Verify**: Check public page renders correctly
7. **Download**: Test install command downloads and verifies checksum

## Configuration

### Environment Variables

**Backend (.env)**
```env
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flo_registry
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-secret-key-change-in-production

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=flo-packages
S3_REGION=us-east-1

# Security
ALLOWED_IMPORT_HOSTS=github.com,gitlab.com,bitbucket.org
MAX_UPLOAD_SIZE_MB=100
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Frontend**
```env
REACT_APP_API_URL=http://localhost:3000/api/v1
```

## Deployment

### Production Deployment

1. **Configure environment variables** for production
2. **Build frontend**: `cd frontend && npm run build`
3. **Build backend**: `cd backend && npm run build`
4. **Setup PostgreSQL** database
5. **Setup S3 or MinIO** for asset storage
6. **Run migrations**: `npm run migrate`
7. **Start backend**: `npm start`
8. **Serve frontend** with nginx or similar

### MinIO Setup

Create the bucket for packages:
```bash
# Using MinIO client
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/flo-packages
mc anonymous set download local/flo-packages
```

## Security Considerations

- **Change default credentials** in production
- **Use strong JWT_SECRET**
- **Enable HTTPS** for production
- **Configure CORS** appropriately
- **Use environment variables** for sensitive data
- **Regular security updates** for dependencies
- **Implement backup strategy** for database and S3
- **Monitor rate limits** and adjust as needed
- **Review audit logs** regularly

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps
# View logs
docker-compose logs postgres
```

### MinIO Connection Issues
```bash
# Access MinIO console
open http://localhost:9001
# Login: minioadmin / minioadmin
```

### Frontend Can't Connect to Backend
- Check REACT_APP_API_URL in frontend
- Verify backend is running on correct port
- Check CORS settings in backend

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/FoundationINCCorporateTeam/PackageManager/issues
- Documentation: This README

## Roadmap

Future enhancements:
- [ ] Auto-import GitHub Releases via webhooks
- [ ] Download analytics and statistics
- [ ] OpenAPI documentation
- [ ] Package dependencies tracking
- [ ] Version comparison
- [ ] API rate limiting per user
- [ ] Email notifications
- [ ] Package search improvements
- [ ] CDN integration for assets
- [ ] Multi-language support
