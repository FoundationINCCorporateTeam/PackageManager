#!/bin/bash

set -e

echo "🚀 Setting up Flo Package Registry..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Setup backend .env if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env file..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env (you can customize it later)"
else
    echo "✅ backend/.env already exists"
fi

echo ""
echo "🐳 Starting Docker containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

echo ""
echo "📊 Running database migrations..."
cd backend
npm install
npm run migrate
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎉 Your Flo Package Registry is ready!"
echo ""
echo "Access the application:"
echo "  Frontend:      http://localhost:3001"
echo "  Backend API:   http://localhost:3000"
echo "  MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
echo ""
echo "Next steps:"
echo "  1. Register an account at http://localhost:3001/register"
echo "  2. Login and go to Admin Dashboard"
echo "  3. Import a GitHub repository"
echo "  4. Create a release and upload assets"
echo ""
echo "To stop the services: docker-compose down"
echo "To view logs: docker-compose logs -f"
