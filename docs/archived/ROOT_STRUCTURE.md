# Root Folder Structure Documentation

**Last Updated:** October 29, 2025  
**Status:** ✅ Optimized - All project-related files properly organized

## Overview

This Angular Monorepo uses an optimized structure where:
- **Monorepo-level configuration files** **** stay in the root directory
- **Project-specific configuration files** reside in their respective project folders
- **Shared build and development tools** are configured at the workspace level

## Root Directory Files Explained

### 📁 Essential Monorepo Configuration

#### `angular.json`
- **Purpose:** Angular CLI workspace configuration
- **Why Root:** Defines all projects (shell, mfe1, mfe2, mfe3, shared) and build targets
- **Must Stay:** Yes - Only one workspace file for entire monorepo
- **Contains:** Project definitions, builder options, configurations

#### `tsconfig.json`
- **Purpose:** Root TypeScript configuration with project references
- **Why Root:** Central TypeScript compiler options for entire monorepo
- **Must Stay:** Yes - Monorepo-wide TypeScript setup
- **References:** Links to each project's tsconfig via references array
- **Projects:** shell, mfe1-dashboard, mfe2-user-management, mfe3-auth, shared

#### `package.json`
- **Purpose:** Workspace dependencies and build scripts
- **Why Root:** Monorepo-level dependencies shared by all projects
- **Must Stay:** Yes - Single source of truth for npm dependencies
- **Contains:**
  - Angular framework dependencies
  - Build tools (CLI, build, SSR)
  - PWA support (@angular/service-worker)
  - Authentication (MSAL)
  - UI libraries (Bootstrap, Material, FontAwesome)
  - Dev tools (TypeScript, ESLint, Cypress, Karma)

### 🔧 Monorepo-Level Developer Tools

#### `eslint.config.js`
- **Purpose:** Root ESLint configuration for entire monorepo
- **Why Root:** Workspace-wide linting rules applying to all `.ts` and `.html` files
- **Must Stay:** Yes - Monorepo-wide code quality standards
- **Extends:** Angular ESLint recommended configs
- **Per-Project:** Each project folder has its own `eslint.config.js` for project-specific overrides

#### `cypress.config.ts`
- **Purpose:** E2E test configuration
- **Why Root:** Cypress runs tests against the shell application on port 4200
- **Must Stay:** Yes - Configured for monorepo's e2e testing strategy
- **Points To:**
  - Shell app base URL: `http://localhost:4200`
  - E2E specs: `cypress/e2e/**/*.cy.{js,jsx,ts,tsx}`
  - Support files: `cypress/support/e2e.ts`

#### `docker-compose.yml`
- **Purpose:** Container orchestration for all services
- **Why Root:** Defines how shell + 3 MFEs + supporting services run together
- **Must Stay:** Yes - Orchestrates entire microservice architecture
- **Services:** shell (4200), mfe1-dashboard (4201), mfe2-user-management (4202), mfe3-auth (4203)
- **References:** Updated paths to `projects/{project}/Dockerfile`

### 📚 Workspace Documentation

#### `README.md`
- **Purpose:** Main project overview and quick start guide
- **Why Root:** Primary documentation entry point

#### `CONTRIBUTING.md`
- **Purpose:** Contribution guidelines
- **Why Root:** Workspace-level contribution standards

#### `CLEANUP_SUMMARY.md`
- **Purpose:** Documentation of root folder cleanup
- **Why Root:** Records optimization history and removed files

#### `PROJECT_STRUCTURE.md`
- **Purpose:** Detailed explanation of folder organization
- **Why Root:** Comprehensive project layout reference

#### `QUICK_REFERENCE.md`
- **Purpose:** Developer quick lookup guide
- **Why Root:** Common commands and file locations

#### `REORGANIZATION_COMPLETE.md`
- **Purpose:** Summary of reorganization completion
- **Why Root:** Documents structural changes and improvements

### 🔧 Editor & Git Configuration

#### `.editorconfig`
- **Purpose:** EditorConfig standardization across all editors
- **Why Root:** Workspace-wide formatting rules

#### `.gitignore`
- **Purpose:** Git exclusions for entire repository
- **Why Root:** Monorepo-wide git configuration

#### `.dockerignore`
- **Purpose:** Docker build exclusions
- **Why Root:** Kept as reference; individual projects have their own

#### `.vscode/`
- **Purpose:** VS Code workspace settings
- **Why Root:** Shared development environment configuration

### 📦 Build & Dependencies

#### `.angular/`
- **Purpose:** Angular build cache
- **Auto-generated:** Yes - created during build process
- **Should Commit:** No - .gitignore excludes this

#### `node_modules/`
- **Purpose:** npm installed dependencies
- **Auto-generated:** Yes - created by `npm install`
- **Should Commit:** No - .gitignore excludes this

#### `dist/`
- **Purpose:** Build output
- **Auto-generated:** Yes - created during build process
- **Should Commit:** No - .gitignore excludes this

## Project Folder Structure

Each project contains its own configuration files:

### `projects/shell/`
- **Type:** Main application (shell/host for microfrontends)
- **Configs:**
  - `tsconfig.app.json` - Application build configuration
  - `tsconfig.spec.json` - Test configuration
  - `eslint.config.js` - Project-specific linting rules
  - `webpack.config.js` - Module Federation configuration
  - `Dockerfile` - Container image definition
  - `nginx.conf` - Web server configuration
  - `.dockerignore` - Docker build exclusions
  - `ngsw-config.json` - Service Worker caching strategy

### `projects/mfe1-dashboard/`
- **Type:** Micro-frontend (Dashboard module)
- **Configs:**
  - `tsconfig.app.json` - Application build configuration
  - `tsconfig.spec.json` - Test configuration
  - `eslint.config.js` - Project-specific linting rules
  - `webpack.config.js` - Module Federation configuration
  - `Dockerfile` - Container image definition
  - `nginx.conf` - Web server configuration
  - `.dockerignore` - Docker build exclusions

### `projects/mfe2-user-management/`
- **Type:** Micro-frontend (User Management module)
- **Configs:** Same as mfe1 structure

### `projects/mfe3-auth/`
- **Type:** Micro-frontend (Authentication/Authorization module)
- **Configs:** Same as mfe1 structure (with auth-specific settings)

### `projects/shared/`
- **Type:** Shared library
- **Configs:**
  - `tsconfig.lib.json` - Library build configuration
  - `tsconfig.lib.prod.json` - Production library configuration
  - `tsconfig.spec.json` - Test configuration
  - `eslint.config.js` - Project-specific linting rules
  - `ng-package.json` - Library packaging configuration
  - `package.json` - Library-specific dependencies

## File Organization Strategy

### ✅ What's in Root (Why)
| File/Folder | Reason | Can Move? |
|---|---|---|
| `angular.json` | Single workspace definition | ❌ No |
| `tsconfig.json` | Monorepo TypeScript setup with references | ❌ No |
| `package.json` | Workspace dependencies | ❌ No |
| `eslint.config.js` | Monorepo linting rules | ❌ No |
| `cypress.config.ts` | E2E testing setup | ❌ No |
| `docker-compose.yml` | Service orchestration | ❌ No |
| `*.md` files | Documentation | ❌ No |
| `.editorconfig` | Editor standardization | ❌ No |
| `.gitignore` | Git configuration | ❌ No |
| `.vscode/` | VS Code settings | ❌ No |

### ✅ What's in Project Folders (Why)
| File/Folder | Projects | Reason | Location |
|---|---|---|---|
| `tsconfig.app.json` | shell, mfe1-3 | Application build config | `projects/{project}/` |
| `tsconfig.spec.json` | All | Test configuration | `projects/{project}/` |
| `tsconfig.lib.json` | shared | Library config | `projects/shared/` |
| `eslint.config.js` | All | Project-specific linting | `projects/{project}/` |
| `webpack.config.js` | shell, mfe1-3 | Module Federation setup | `projects/{project}/` |
| `Dockerfile` | shell, mfe1-3 | Container images | `projects/{project}/` |
| `nginx.conf` | All | Web server config | `projects/{project}/` |
| `.dockerignore` | All | Docker exclusions | `projects/{project}/` |
| `ngsw-config.json` | shell | Service Worker config | `projects/shell/` |
| `ng-package.json` | shared | Library packaging | `projects/shared/` |

## Recent Optimizations

### ✅ Completed
- Dockerfiles moved to individual project folders
- nginx.conf files organized by project
- ngsw-config.json moved to shell project
- .dockerignore files distributed to projects
- Temporary scripts removed (generate-*.js, setup-pwa.sh)
- Old documentation archived (PWA_INSTALL_*.md)
- Reference configs archived to `docs/archived/`
- Root folder reduced by 54% (from ~37 to 18 items)

### ✅ Already Optimized
- Project-specific TypeScript configs in project folders
- Project-specific ESLint configs in project folders
- Project-specific webpack configs in project folders
- All monorepo-level files remain in root

## Build Process

### Development
```bash
# Start all services (shell + MFEs)
npm start                    # Shell only
npm run start:all           # Shell + MFE1 + MFE2

# Individual services
npm run start:shell         # Port 4200
npm run start:mfe1          # Port 4201
npm run start:mfe2          # Port 4202
```

### Production Build
```bash
# Build all projects
npm run build               # All projects
npm run build:shell         # Shell only
npm run build:mfe1          # Dashboard MFE
npm run build:mfe2          # User Management MFE
npm run build:mfe3          # Auth MFE
npm run build:shared        # Shared library
```

### Docker
```bash
# Build and run all services
docker-compose up -d        # Starts shell + 3 MFEs

# Individual builds reference project Dockerfiles
docker build -f projects/shell/Dockerfile -t angular-mfe-shell .
docker build -f projects/mfe1-dashboard/Dockerfile -t angular-mfe-mfe1 .
```

## TypeScript Path Aliases

Configured in root `tsconfig.json`:
```json
"paths": {
  "shared": ["projects/shared/src/public-api"]
}
```

Allows imports like:
```typescript
import { PwaService } from 'shared';
```

## Configuration Inheritance

```
Root tsconfig.json
├── projects/shell/tsconfig.app.json
├── projects/shell/tsconfig.spec.json
├── projects/mfe1-dashboard/tsconfig.app.json
├── projects/mfe1-dashboard/tsconfig.spec.json
├── projects/mfe2-user-management/tsconfig.app.json
├── projects/mfe2-user-management/tsconfig.spec.json
├── projects/mfe3-auth/tsconfig.app.json
├── projects/mfe3-auth/tsconfig.spec.json
├── projects/shared/tsconfig.lib.json
├── projects/shared/tsconfig.lib.prod.json
└── projects/shared/tsconfig.spec.json
```

Each project's tsconfig extends the root with: `"extends": "../../tsconfig.json"`

## Summary

✅ **Your monorepo is already well-optimized!**

- All monorepo-level configuration in root (angular.json, tsconfig.json, package.json)
- All project-specific configuration in project folders
- Clear separation of concerns
- Docker and build files organized by project
- Root directory contains only essential files (18 items vs original 37+)
- No project-related JSON/TS files need to be moved - already in optimal locations

The structure follows Angular CLI best practices for monorepos with Module Federation microfrontends.
