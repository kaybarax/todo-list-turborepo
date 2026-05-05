# Mobile Deployment Strategy

## Overview

The mobile application (`apps/mobile`) is built and deployed using Expo Application Services (EAS) for iOS and Android. This document outlines the credentials strategy, runtime configuration, and the split of responsibilities between Terraform and EAS.

## EAS Credentials Strategy

1. **EAS-Managed Credentials**: We use EAS-managed credentials for iOS and Android builds. Expo handles the generation and secure storage of distribution certificates, provisioning profiles, and keystores.
2. **GitHub Environment Secrets**: To authenticate EAS CLI during GitHub Actions builds, we store `EXPO_TOKEN` (or `EAS_TOKEN`) as a GitHub environment secret.
3. **Manual Credentials (Fallback)**: If manual control over keystores or Apple certificates is required, they will be documented and securely injected via GitHub Actions secrets, rather than stored in the repository.

## Runtime Configuration Strategy

Runtime configuration is managed through environment variables to avoid baking production secrets into the mobile app bundle:

- **API Base URL**: Configured per environment (development, preview, production) via `.env` files or EAS build variables (`EXPO_PUBLIC_API_URL`).
- **Blockchain RPC URLs**: Public RPC endpoints are provided via `EXPO_PUBLIC_RPC_URL_*` variables. Private keys or sensitive blockchain secrets are NEVER included in the mobile build.
- **Wallet/Project IDs**: Third-party integrations like WalletConnect use public project IDs (`EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID`).

All environment variables injected into the mobile app must begin with `EXPO_PUBLIC_` to be securely bundled. Production secrets remain strictly server-side (API/Ingestion).

## Infrastructure as Code (IaC) Responsibility Split

To maintain a decoupled architecture, responsibilities are clearly split between our Terraform IaC and Expo EAS:

- **Terraform/GitHub Actions**:
  - Manages GitHub environments (dev, staging, production).
  - Manages GitHub repository secrets (like `EXPO_TOKEN`).
  - Provisions the backend infrastructure (API, Database, Redis) that the mobile app consumes.
- **Expo Application Services (EAS)**:
  - Manages iOS/Android build processes.
  - Handles code signing and credentials.
  - Manages App Store Connect and Google Play Console submissions (`eas submit`).

Terraform will **not** attempt to manage App Store or Play Store releases. Its scope regarding mobile is limited to configuring the CI/CD pipeline and required secrets to run the EAS builds.
