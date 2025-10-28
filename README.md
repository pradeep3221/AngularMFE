# Angular Microfrontend (MFE) Sample Project

This project demonstrates a complete Angular microfrontend architecture using Module Federation, featuring a shell application that orchestrates multiple independent microfrontend applications.

## 🏗️ Architecture Overview

The project consists of:

- **Shell Application** (Port 4200) - The main host application that orchestrates microfrontends
- **MFE1 - Dashboard** (Port 4201) - Dashboard microfrontend with analytics and metrics
- **MFE2 - User Management** (Port 4202) - User management microfrontend
- **Shared Library** - Common services for inter-MFE communication, authentication, and state management

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm 8.x or higher
- Angular CLI 20.x

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AngularMFE
```

2. Install dependencies:
```bash
npm install
```

3. Start all applications:
```bash
npm run start:all
```

This will start:
- Shell application at http://localhost:4200
- MFE1 Dashboard at http://localhost:4201
- MFE2 User Management at http://localhost:4202

### Individual Application Startup

You can also start applications individually:

```bash
# Start shell application
npm run start:shell

# Start MFE1 Dashboard
npm run start:mfe1

# Start MFE2 User Management
npm run start:mfe2
```

## 🧪 Testing

### Unit Tests

Run unit tests for all projects:
```bash
npm test
```

Run tests for specific projects:
```bash
npm run test:shared      # Shared library tests
npm run test:shell       # Shell application tests
npm run test:mfe1        # MFE1 Dashboard tests
npm run test:mfe2        # MFE2 User Management tests
```

### End-to-End Tests

Run E2E tests with Cypress:
```bash
npm run e2e              # Run E2E tests headlessly
npm run e2e:open         # Open Cypress test runner
```

### Linting

Run ESLint across all projects:
```bash
npm run lint
```

## 🏗️ Build

Build all applications for production:
```bash
npm run build:shell
npm run build:mfe1
npm run build:mfe2
npm run build:shared
```

## 🐳 Docker Deployment

### Using Docker Compose

Build and run all applications using Docker:
```bash
docker-compose up --build
```

This will start all applications in containers:
- Shell: http://localhost:4200
- MFE1: http://localhost:4201
- MFE2: http://localhost:4202

### Individual Docker Builds

Build individual Docker images:
```bash
# Build Shell application
docker build -f Dockerfile.shell -t angular-mfe-shell .

# Build MFE1 Dashboard
docker build -f Dockerfile.mfe1 -t angular-mfe1-dashboard .

# Build MFE2 User Management
docker build -f Dockerfile.mfe2 -t angular-mfe2-user-management .
```

## 📁 Project Structure

```
AngularMFE/
├── projects/
│   ├── shell/                 # Shell (Host) Application
│   ├── mfe1-dashboard/        # Dashboard Microfrontend
│   ├── mfe2-user-management/  # User Management Microfrontend
│   └── shared/                # Shared Library
├── cypress/                   # E2E Tests
├── .github/workflows/         # CI/CD Pipeline
├── docker-compose.yml         # Docker Compose Configuration
├── Dockerfile.*              # Docker configurations
└── README.md
```

## 🔧 Configuration

### Module Federation

Each microfrontend is configured with Module Federation:

- **Shell**: Consumes remote modules from MFE1 and MFE2
- **MFE1**: Exposes dashboard components
- **MFE2**: Exposes user management components

Configuration files:
- `projects/shell/webpack.config.js`
- `projects/mfe1-dashboard/webpack.config.js`
- `projects/mfe2-user-management/webpack.config.js`

### Shared Services

The shared library provides:
- **EventBusService**: Inter-MFE communication
- **AuthService**: Authentication management
- **StateManagementService**: Global state management

## 🚀 CI/CD Pipeline

The project includes a complete CI/CD pipeline with GitHub Actions:

1. **Lint and Test**: ESLint, unit tests for all projects
2. **E2E Tests**: Cypress end-to-end testing
3. **Build and Push**: Docker image builds and registry push
4. **Deploy**: Automated deployment (configurable)

## 📚 Development Guidelines

### Adding New Microfrontends

1. Generate new Angular application:
```bash
ng generate application new-mfe --routing --style=scss
```

2. Configure Module Federation in `webpack.config.js`
3. Update `angular.json` to use Module Federation builder
4. Add routing configuration in shell application
5. Update Docker and CI/CD configurations

### Inter-MFE Communication

Use the EventBusService for communication between microfrontends:

```typescript
// Emit event from one MFE
eventBus.emit('user-updated', { userId: 123 }, 'mfe2');

// Listen in another MFE
eventBus.on('user-updated').subscribe(event => {
  console.log('User updated:', event.payload);
});
```

### State Management

Use StateManagementService for global state:

```typescript
// Set global data
stateService.setGlobalData('currentUser', user);

// Get global data
const user = stateService.getGlobalData('currentUser');

// Listen to state changes
stateService.state$.subscribe(state => {
  console.log('State updated:', state);
});
```

## 🔒 Security Considerations

- CORS configuration for cross-origin requests
- Content Security Policy headers
- Authentication token management
- Secure communication between microfrontends

## � Progressive Web App (PWA)

This project includes a complete **Progressive Web App (PWA)** implementation with the following features:

- ✅ Service Worker for offline support
- ✅ Automatic update detection and notification
- ✅ App installability on desktop and mobile
- ✅ Intelligent caching strategies
- ✅ Online/offline status detection

### PWA Features

- **Install App**: Users can install the app on their devices from the home screen
- **Offline Support**: Access previously loaded content when offline
- **Auto-Updates**: Receive notifications when new versions are available
- **Fast Loading**: Benefit from service worker caching for improved performance

### PWA Quick Start

```bash
# Build for production with PWA support
npm run build:shell

# Test PWA locally
npx http-server dist/shell -c-1

# Or use Docker
docker-compose up
```

For comprehensive PWA documentation, see:
- **[PWA_INDEX.md](./PWA_INDEX.md)** - Complete PWA documentation index
- **[PWA_QUICK_START.md](./PWA_QUICK_START.md)** - Quick start guide
- **[PWA_IMPLEMENTATION.md](./PWA_IMPLEMENTATION.md)** - Technical documentation

## �📈 Performance Optimization

- Lazy loading of microfrontends
- Shared dependencies optimization
- Bundle size monitoring
- Caching strategies
- Service Worker for offline caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the full test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 4200, 4201, 4202 are available
2. **Module Federation errors**: Check webpack configurations
3. **CORS issues**: Verify proxy configurations in development

### Getting Help

- Check the [Issues](../../issues) section
- Review the [Wiki](../../wiki) for detailed guides
- Contact the development team

## 🔗 Useful Links

- [Angular Documentation](https://angular.io/docs)
- [Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Cypress Testing](https://docs.cypress.io/)
- [Docker Documentation](https://docs.docker.com/)
