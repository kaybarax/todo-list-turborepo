# Environment Variable Contract

This document defines the environment variables used across the Todo List Turborepo projects, their owners, security status, and sources of truth.

## Standard Variable Definitions

| Variable Name | Owner          | Secret  | Build/Runtime | Source of Truth | Environments | Description                                            |
| ------------- | -------------- | ------- | ------------- | --------------- | ------------ | ------------------------------------------------------ |
| `NODE_ENV`    | All            | No      | Both          | Environment     | All          | deployment environment (development, production, test) |
| `PORT`        | API, Ingestion | No      | Runtime       | Environment     | All          | Port the service listens on                            |
| `MONGODB_URI` | API, Ingestion | **Yes** | Runtime       | Secrets Manager | All          | MongoDB connection string                              |
| `REDIS_URI`   | API            | **Yes** | Runtime       | Secrets Manager | All          | Redis connection string (or host/port components)      |
| `JWT_SECRET`  | API            | **Yes** | Runtime       | Secrets Manager | All          | Secret key for signing JWT tokens                      |
| `LOG_LEVEL`   | All            | No      | Runtime       | Environment     | All          | Logging verbosity (debug, info, warn, error)           |

## Web Application (`apps/web`)

These variables are prefixed with `NEXT_PUBLIC_` to be exposed to the browser.

| Variable Name                             | Secret | Build/Runtime | Source of Truth  | Description                          |
| ----------------------------------------- | ------ | ------------- | ---------------- | ------------------------------------ |
| `NEXT_PUBLIC_API_URL`                     | No     | Build         | Terraform Output | Base URL for the NestJS API          |
| `NEXT_PUBLIC_WS_URL`                      | No     | Build         | Terraform Output | WebSocket URL for the NestJS API     |
| `NEXT_PUBLIC_POLYGON_RPC_URL`             | No     | Build         | Environment      | RPC endpoint for Polygon             |
| `NEXT_PUBLIC_SOLANA_RPC_URL`              | No     | Build         | Environment      | RPC endpoint for Solana              |
| `NEXT_PUBLIC_POLKADOT_RPC_URL`            | No     | Build         | Environment      | RPC endpoint for Polkadot            |
| `NEXT_PUBLIC_MOONBEAM_RPC_URL`            | No     | Build         | Environment      | RPC endpoint for Moonbeam            |
| `NEXT_PUBLIC_BASE_RPC_URL`                | No     | Build         | Environment      | RPC endpoint for Base                |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`    | No     | Build         | WalletConnect    | Project ID for WalletConnect v2      |
| `NEXT_PUBLIC_ENABLE_BLOCKCHAIN`           | No     | Build         | Environment      | Feature flag for blockchain features |
| `NEXT_PUBLIC_ENABLE_PWA`                  | No     | Build         | Build            | Feature flag for PWA support         |
| `NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT` | No     | Build         | Terraform Output | OTLP endpoint for tracing            |

## NestJS API (`apps/api`)

| Variable Name       | Secret  | Build/Runtime | Source of Truth  | Description                     |
| ------------------- | ------- | ------------- | ---------------- | ------------------------------- |
| `REDIS_HOST`        | No      | Runtime       | Terraform Output | Redis server host               |
| `REDIS_PORT`        | No      | Runtime       | Terraform Output | Redis server port               |
| `REDIS_PASSWORD`    | **Yes** | Runtime       | Secrets Manager  | Redis server password           |
| `JWT_EXPIRES_IN`    | No      | Runtime       | Environment      | JWT expiration time (e.g., 24h) |
| `TELEMETRY_ENABLED` | No      | Runtime       | Environment      | Enable/disable OTEL telemetry   |
| `OTLP_ENDPOINT`     | No      | Runtime       | Terraform Output | OTLP collector endpoint         |
| `OTEL_SERVICE_NAME` | No      | Runtime       | Environment      | Service name for tracing        |

## Ingestion Service (`apps/ingestion`)

| Variable Name        | Secret | Build/Runtime | Source of Truth | Description                            |
| -------------------- | ------ | ------------- | --------------- | -------------------------------------- |
| `MONGODB_DB_NAME`    | No     | Runtime       | Environment     | MongoDB database name                  |
| `INGESTION_INTERVAL` | No     | Runtime       | Environment     | Interval between ingestion cycles (ms) |
| `POLYGON_RPC_URL`    | No     | Runtime       | Environment     | RPC endpoint for Polygon               |
| `SOLANA_RPC_URL`     | No     | Runtime       | Environment     | RPC endpoint for Solana                |
| `POLKADOT_RPC_URL`   | No     | Runtime       | Environment     | RPC endpoint for Polkadot              |
| `MOONBEAM_RPC_URL`   | No     | Runtime       | Environment     | RPC endpoint for Moonbeam              |
| `BASE_RPC_URL`       | No     | Runtime       | Environment     | RPC endpoint for Base                  |

## Mobile App (`apps/mobile`)

These variables are prefixed with `EXPO_PUBLIC_` to be available in the React Native bundle.

| Variable Name                          | Secret | Build/Runtime | Source of Truth  | Description                          |
| -------------------------------------- | ------ | ------------- | ---------------- | ------------------------------------ |
| `EXPO_PUBLIC_API_URL`                  | No     | Build         | Terraform Output | Base URL for the NestJS API          |
| `EXPO_PUBLIC_WS_URL`                   | No     | Build         | Terraform Output | WebSocket URL for the NestJS API     |
| `EXPO_PUBLIC_POLYGON_RPC_URL`          | No     | Build         | Environment      | RPC endpoint for Polygon             |
| `EXPO_PUBLIC_SOLANA_RPC_URL`           | No     | Build         | Environment      | RPC endpoint for Solana              |
| `EXPO_PUBLIC_POLKADOT_RPC_URL`         | No     | Build         | Environment      | RPC endpoint for Polkadot            |
| `EXPO_PUBLIC_MOONBEAM_RPC_URL`         | No     | Build         | Environment      | RPC endpoint for Moonbeam            |
| `EXPO_PUBLIC_BASE_RPC_URL`             | No     | Build         | Environment      | RPC endpoint for Base                |
| `EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID` | No     | Build         | WalletConnect    | Project ID for WalletConnect v2      |
| `EXPO_PUBLIC_ENABLE_BLOCKCHAIN`        | No     | Build         | Environment      | Feature flag for blockchain features |

## Smart Contracts (`apps/smart-contracts`)

| Variable Name          | Secret  | Build/Runtime | Source of Truth | Description                                 |
| ---------------------- | ------- | ------------- | --------------- | ------------------------------------------- |
| `POLYGON_PRIVATE_KEY`  | **Yes** | Runtime       | GitHub Secret   | Private key for Polygon deployments         |
| `SOLANA_PRIVATE_KEY`   | **Yes** | Runtime       | GitHub Secret   | Private key for Solana deployments          |
| `POLKADOT_PRIVATE_KEY` | **Yes** | Runtime       | GitHub Secret   | Private key for Polkadot deployments        |
| `MOONBEAM_PRIVATE_KEY` | **Yes** | Runtime       | GitHub Secret   | Private key for Moonbeam deployments        |
| `BASE_PRIVATE_KEY`     | **Yes** | Runtime       | GitHub Secret   | Private key for Base deployments            |
| `ETHERSCAN_API_KEY`    | **Yes** | Runtime       | GitHub Secret   | API key for verifying contracts on Polygon  |
| `MOONBEAM_API_KEY`     | **Yes** | Runtime       | GitHub Secret   | API key for verifying contracts on Moonbeam |
| `BASESCAN_API_KEY`     | **Yes** | Runtime       | GitHub Secret   | API key for verifying contracts on Base     |
