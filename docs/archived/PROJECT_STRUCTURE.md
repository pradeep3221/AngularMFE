# Project Structure Organization

## Overview

All project-specific Docker and configuration files have been moved to their respective project folders for better organization and maintainability.

## Folder Structure

```
AngularMFE/
├── projects/
│   ├── shell/
│   │   ├── Dockerfile           ← Shell container build
│   │   ├── nginx.conf           ← Shell nginx config
│   │   ├── ngsw-config.json     ← PWA service worker config
│   │   ├── .dockerignore        ← Docker build ignore rules
│   │   ├── public/
│   │   │   ├── manifest.webmanifest
│   │   │   └── assets/
│   │   └── src/
│   │
│   ├── mfe1-dashboard/
│   │   ├── Dockerfile           ← MFE1 container build
│   │   ├── nginx.conf           ← MFE1 nginx config
│   │   ├── .dockerignore        ← Docker build ignore rules
│   │   └── src/
│   │
│   ├── mfe2-user-management/
│   │   ├── Dockerfile           ← MFE2 container build
│   │   ├── nginx.conf           ← MFE2 nginx config
│   │   ├── .dockerignore        ← Docker build ignore rules
│   │   └── src/
│   │
│   ├── mfe3-auth/
│   │   ├── Dockerfile           ← MFE3 container build
│   │   ├── nginx.conf           ← MFE3 nginx config
│   │   ├── .dockerignore        ← Docker build ignore rules
│   │   └── src/
│   │
│   └── shared/
│       └── src/
│
├── docker-compose.yml           ← Root orchestration (references individual Dockerfiles)
├── .dockerignore                ← Root-level docker ignore (for reference)
├── nginx.conf                   ← Root-level nginx config (for reference)
├── ngsw-config.json             ← Root-level PWA config (for reference)
├── package.json                 ← Root workspace dependencies
├── angular.json                 ← Root workspace config
└── tsconfig.json                ← Root TypeScript config
```

## Docker Configuration

### Updated docker-compose.yml

The `docker-compose.yml` now references Dockerfiles in individual project folders:

```yaml
shell:
  build:
    context: .
    dockerfile: projects/shell/Dockerfile  # <- Updated path

mfe1:
  build:
    context: .
    dockerfile: projects/mfe1-dashboard/Dockerfile  # <- Updated path

mfe2:
  build:
    context: .
    dockerfile: projects/mfe2-user-management/Dockerfile  # <- Updated path

mfe3:
  build:
    context: .
    dockerfile: projects/mfe3-auth/Dockerfile  # <- Updated path
```

### Docker Build Context

The build context remains at the root level to allow access to:
- `package.json` and `package-lock.json`
- `angular.json` and `tsconfig.json`
- All project source files

### Individual Dockerfiles

Each project folder now contains its own `Dockerfile` with:
- Project-specific build instructions
- Updated path references (e.g., `projects/shell/nginx.conf`)
- Standalone configuration for each service

## File Organization

### Per-Project Files

Each project folder now contains:
- **Dockerfile**: Container build configuration
- **nginx.conf**: HTTP server configuration
- **.dockerignore**: Docker build exclusions
- **ngsw-config.json** (shell only): PWA service worker config

### Shared Resources

Root-level files (for reference/backup):
- `.dockerignore`: Global docker ignore rules
- `nginx.conf`: Template/reference configuration
- `ngsw-config.json`: Template/reference config

## Building with Docker

### Build All Services

```bash
docker-compose up -d --build
```

### Build Specific Service

```bash
# Build only shell
docker-compose up -d --build shell

# Build only MFE1
docker-compose up -d --build mfe1

# Build only MFE2
docker-compose up -d --build mfe2

# Build only MFE3
docker-compose up -d --build mfe3
```

### View Services

```bash
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f shell
docker-compose logs -f mfe1
```

### Stop Services

```bash
docker-compose down
```

## Benefits of This Organization

✅ **Clarity**: Each project is self-contained with its own configuration  
✅ **Maintenance**: Easier to locate and update project-specific files  
✅ **Scalability**: Easy to add new services with their own Dockerfile  
✅ **Independence**: Each service configuration is clearly separated  
✅ **Backup**: Root-level reference files retained for documentation  

## Next Steps

1. **Development**: Continue using `npm run start:*` for local development
2. **Docker**: Use `docker-compose up -d` for containerized deployments
3. **Updates**: Modify individual `Dockerfile` or `nginx.conf` files as needed
4. **Scaling**: Add new projects with their own Dockerfile following this pattern

## File References

| File | Location | Purpose |
|------|----------|---------|
| Dockerfile | `projects/{project}/` | Container build for each service |
| nginx.conf | `projects/{project}/` | Web server config for each service |
| ngsw-config.json | `projects/shell/` | PWA configuration |
| .dockerignore | `projects/{project}/` | Docker build exclusions |
| docker-compose.yml | Root | Orchestration file (references all services) |
| package.json | Root | Workspace dependencies |
| angular.json | Root | Angular workspace config |

---

**Status**: ✅ All project files organized and docker-compose updated!
