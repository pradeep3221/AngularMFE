#!/bin/bash

# PWA Implementation Setup Script
# This script helps set up the PWA implementation for the Angular MFE project

echo "🚀 PWA Implementation Setup for Angular MFE"
echo "=========================================="
echo ""

# Check for required files
check_files() {
    local required_files=(
        "ngsw-config.json"
        "projects/shell/public/manifest.webmanifest"
        "projects/shared/src/lib/pwa.service.ts"
        "projects/shell/src/app/components/update-available.component.ts"
        "projects/shell/src/app/components/offline-fallback.component.ts"
        "PWA_IMPLEMENTATION.md"
    )

    echo "✓ Checking required files..."
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            echo "  ✅ $file"
        else
            echo "  ❌ Missing: $file"
        fi
    done
    echo ""
}

# Install dependencies
install_deps() {
    echo "✓ Installing dependencies..."
    npm install
    echo ""
}

# Build for production
build_production() {
    echo "✓ Building shell application..."
    npm run build:shell
    echo ""
}

# Start development server
start_dev() {
    echo "✓ Starting development server..."
    npm run start
    echo ""
}

# Main menu
show_menu() {
    echo "Select an option:"
    echo "1) Check PWA files"
    echo "2) Install dependencies"
    echo "3) Build for production"
    echo "4) Start development server"
    echo "5) Run all setup steps"
    echo "6) Exit"
    echo ""
    read -p "Enter choice [1-6]: " choice

    case $choice in
        1)
            check_files
            show_menu
            ;;
        2)
            install_deps
            show_menu
            ;;
        3)
            build_production
            show_menu
            ;;
        4)
            start_dev
            ;;
        5)
            check_files
            install_deps
            build_production
            show_menu
            ;;
        6)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            show_menu
            ;;
    esac
}

# Run setup
check_files
show_menu
