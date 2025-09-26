# Contributing to Angular MFE Sample Project

Thank you for your interest in contributing to this Angular Microfrontend sample project! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 8.x or higher
- Angular CLI 20.x
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/your-username/AngularMFE.git
cd AngularMFE
```

3. Install dependencies:
```bash
npm install
```

4. Create a new branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

## 📝 Development Guidelines

### Code Style

- Follow Angular style guide
- Use TypeScript strict mode
- Maintain consistent formatting with Prettier
- Follow ESLint rules

### Commit Messages

Use conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(shell): add navigation component
fix(mfe1): resolve dashboard loading issue
docs(readme): update installation instructions
```

### Testing Requirements

- Write unit tests for new functionality
- Ensure all existing tests pass
- Add E2E tests for new user flows
- Maintain test coverage above 80%

### Code Review Process

1. Create a pull request with clear description
2. Ensure all CI checks pass
3. Request review from maintainers
4. Address feedback and update PR
5. Merge after approval

## 🏗️ Architecture Guidelines

### Adding New Microfrontends

1. Use Angular CLI to generate new application
2. Configure Module Federation properly
3. Update routing in shell application
4. Add appropriate tests
5. Update documentation

### Shared Services

- Add new shared services to the shared library
- Ensure proper TypeScript interfaces
- Write comprehensive unit tests
- Document service usage

### Inter-MFE Communication

- Use EventBusService for communication
- Define clear event interfaces
- Document event contracts
- Test communication flows

## 🧪 Testing Guidelines

### Unit Tests

- Test all public methods
- Mock external dependencies
- Use descriptive test names
- Group related tests in describe blocks

### E2E Tests

- Test complete user workflows
- Use page object pattern
- Include error scenarios
- Test cross-MFE interactions

### Running Tests

```bash
# Run all unit tests
npm test

# Run specific project tests
npm run test:shared
npm run test:shell
npm run test:mfe1
npm run test:mfe2

# Run E2E tests
npm run e2e
npm run e2e:open
```

## 📚 Documentation

### Code Documentation

- Use JSDoc for complex functions
- Document public APIs
- Include usage examples
- Keep comments up to date

### README Updates

- Update README for new features
- Include setup instructions
- Add troubleshooting information
- Update architecture diagrams

## 🐛 Bug Reports

When reporting bugs, include:

1. Clear description of the issue
2. Steps to reproduce
3. Expected vs actual behavior
4. Environment information
5. Screenshots if applicable

Use the bug report template in GitHub issues.

## 💡 Feature Requests

For new features:

1. Check existing issues first
2. Provide clear use case
3. Describe proposed solution
4. Consider implementation complexity
5. Discuss with maintainers

## 🔒 Security

- Report security issues privately
- Don't include sensitive data in commits
- Follow security best practices
- Update dependencies regularly

## 📋 Pull Request Checklist

Before submitting a PR:

- [ ] Code follows style guidelines
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts
- [ ] CI checks pass
- [ ] Self-review completed

## 🤝 Community

- Be respectful and inclusive
- Help others learn
- Share knowledge
- Provide constructive feedback

## 📞 Getting Help

- Check existing documentation
- Search GitHub issues
- Ask questions in discussions
- Contact maintainers

Thank you for contributing to the Angular MFE Sample Project!
