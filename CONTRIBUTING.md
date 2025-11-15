# Contributing to Flo Package Registry

Thank you for your interest in contributing to the Flo Package Registry! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/PackageManager.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit: `git commit -m "Description of changes"`
7. Push: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

See the main [README.md](README.md) for detailed setup instructions.

Quick start:
```bash
./setup.sh
```

## Code Style

### Backend (TypeScript)
- Follow the existing ESLint configuration
- Use TypeScript strict mode
- Add JSDoc comments for public APIs
- Run `npm run lint` before committing

### Frontend (React/TypeScript)
- Use functional components with hooks
- Follow React best practices
- Use meaningful component and variable names
- Keep components focused and reusable

## Testing

### Backend Tests
```bash
cd backend
npm test
```

Write tests for:
- New API endpoints
- Business logic functions
- Security features
- Database operations

### Frontend Tests
```bash
cd frontend
npm test
```

## Pull Request Guidelines

1. **Title**: Use a clear, descriptive title
2. **Description**: Explain what changes you made and why
3. **Tests**: Include tests for new features
4. **Documentation**: Update README if needed
5. **Breaking Changes**: Clearly mark any breaking changes

## Commit Messages

Use clear, descriptive commit messages:
- `feat: Add package search functionality`
- `fix: Resolve checksum verification issue`
- `docs: Update API documentation`
- `test: Add integration tests for import`
- `refactor: Simplify asset upload logic`

## Areas for Contribution

### High Priority
- Auto-import GitHub Releases via webhooks
- Download analytics and statistics
- OpenAPI/Swagger documentation
- Package dependencies tracking
- Improved error handling

### Nice to Have
- Additional repository platforms (Gitea, Codeberg)
- CDN integration for assets
- Package version comparison
- Email notifications
- Advanced search filters
- Rate limiting per user/API key

### Documentation
- Video tutorials
- More examples
- API client libraries
- Deployment guides for various platforms

## Security

If you discover a security vulnerability:
1. **Do not** open a public issue
2. Email the maintainers privately
3. Include detailed information about the vulnerability
4. Wait for a response before disclosing publicly

## Questions?

- Open a GitHub Discussion for questions
- Check existing issues before creating new ones
- Be respectful and constructive in all interactions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
