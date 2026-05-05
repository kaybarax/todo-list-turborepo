# Frequently Asked Questions (FAQ)

This document answers common questions about the Todo App monorepo, covering development, deployment, blockchain integration, and general usage.

## 🏗️ General Architecture

### Q: Why use a monorepo structure?

**A:** The monorepo structure provides several benefits:

- **Code Sharing**: Shared packages and utilities across applications
- **Unified Tooling**: Consistent linting, testing, and build processes
- **Atomic Changes**: Make changes across multiple apps in a single commit
- **Simplified Dependencies**: Easier dependency management and updates
- **Developer Experience**: Single repository to clone and understand

### Q: What is Turborepo and why do we use it?

**A:** Turborepo is a build system optimized for monorepos that provides:

- **Incremental Builds**: Only rebuilds what changed
- **Remote Caching**: Share build artifacts across team and CI
- **Parallel Execution**: Run tasks across packages simultaneously
- **Task Dependencies**: Define relationships between build tasks
- **Pipeline Optimization**: Intelligent task scheduling

### Q: How does the package dependency system work?

**A:** The monorepo uses pnpm workspaces with internal package dependencies:

```json
// apps/web/package.json
{
  "dependencies": {
    "@todo/ui-web": "workspace:*",
    "@todo/services": "workspace:*"
  }
}
```

This allows apps to depend on shared packages without publishing to npm.

## 🚀 Development

### Q: How do I add a new package to the monorepo?

**A:** Follow these steps:

1. Create the package directory:

   ```bash
   mkdir packages/my-new-package
   cd packages/my-new-package
   ```

2. Initialize package.json:

   ```json
   {
     "name": "@todo/my-new-package",
     "version": "0.0.0",
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts"
   }
   ```

3. Add to workspace root:

   ```bash
   pnpm install
   ```

4. Update Turborepo configuration if needed:
   ```json
   // turbo.json
   {
     "pipeline": {
       "build": {
         "dependsOn": ["^build"]
       }
     }
   }
   ```

### Q: How do I run only specific apps or packages?

**A:** Use pnpm's filtering capabilities:

```bash
# Run dev for specific app
pnpm --filter @todo/web dev

# Run build for all apps (not packages)
pnpm --filter "./apps/*" build

# Run test for packages only
pnpm --filter "./packages/*" test

# Run command in multiple packages
pnpm --filter "@todo/web" --filter "@todo/api" build
```

### Q: How do I add dependencies to specific packages?

**A:** Use pnpm's workspace commands:

```bash
# Add dependency to specific package
pnpm --filter @todo/web add react-query

# Add dev dependency
pnpm --filter @todo/api add -D @types/jest

# Add dependency to workspace root
pnpm add -w typescript

# Add internal package dependency
pnpm --filter @todo/web add @todo/ui-web@workspace:*
```

### Q: Why are my changes not reflected after building?

**A:** This could be due to several reasons:

1. **Turborepo Cache**: Clear cache with `pnpm turbo clean`
2. **Stale Dependencies**: Run `pnpm install` to update dependencies
3. **Build Order**: Ensure dependencies are built first with `pnpm build`
4. **File Watching**: Restart dev servers if hot reload isn't working

### Q: How do I debug TypeScript errors across packages?

**A:** Use these approaches:

```bash
# Check types for specific package
pnpm --filter @todo/web typecheck

# Check types for all packages
pnpm typecheck

# Use TypeScript project references
# Ensure tsconfig.json has proper references
{
  "references": [
    { "path": "./packages/ui-web" },
    { "path": "./packages/services" }
  ]
}
```

## 🗄️ Database

### Q: How do I reset the database during development?

**A:** Use the provided database scripts:

```bash
# Reset database and reseed
pnpm db:reset

# Just run migrations
pnpm db:migrate

# Just seed data
pnpm db:seed

# Drop all data (careful!)
pnpm db:drop
```

### Q: How do I add a new database migration?

**A:** Create a new migration file:

1. Create migration file:

   ```bash
   # Create new migration
   touch db/migrations/$(date +%Y%m%d%H%M%S)_add_new_field.js
   ```

2. Write migration:

   ```javascript
   // db/migrations/20240115120000_add_new_field.js
   module.exports = {
     async up(db) {
       await db.collection('todos').updateMany({}, { $set: { newField: 'defaultValue' } });
     },

     async down(db) {
       await db.collection('todos').updateMany({}, { $unset: { newField: '' } });
     },
   };
   ```

3. Run migration:
   ```bash
   pnpm db:migrate
   ```

### Q: How do I connect to different databases for different environments?

**A:** Use environment-specific configuration:

```bash
# Development
DATABASE_URL=mongodb://localhost:27017/todoapp_dev

# Testing
DATABASE_URL=mongodb://localhost:27017/todoapp_test

# Production
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/todoapp_prod
```

The application automatically uses the appropriate database based on `NODE_ENV`.

## ⛓️ Blockchain Integration

### Q: Which blockchain networks are supported?

**A:** The application supports three networks:

- **Polygon**: Ethereum-compatible network with low fees
- **Solana**: High-performance blockchain with fast transactions
- **Polkadot**: Multi-chain network with interoperability

Each network has its own smart contracts and integration services.

### Q: How do I add support for a new blockchain network?

**A:** Follow these steps:

1. **Add Network Configuration**:

   ```typescript
   // packages/services/src/blockchain/networks.ts
   export enum BlockchainNetwork {
     POLYGON = 'polygon',
     SOLANA = 'solana',
     POLKADOT = 'polkadot',
     NEW_NETWORK = 'new_network', // Add here
   }
   ```

2. **Create Service Implementation**:

   ```typescript
   // apps/api/src/blockchain/services/new-network.service.ts
   @Injectable()
   export class NewNetworkService implements BlockchainServiceInterface {
     async createTodo(data: CreateTodoOnChainDto): Promise<TransactionResult> {
       // Implementation
     }
   }
   ```

3. **Add Smart Contracts**:

   ```bash
   mkdir apps/smart-contracts/new-network
   # Add contract code and deployment scripts
   ```

4. **Update Frontend**:
   ```typescript
   // Add network to UI components
   // Update wallet connection logic
   // Add network-specific configurations
   ```

### Q: How do I test blockchain integration locally?

**A:** Use local blockchain networks:

```bash
# Start local Ethereum network (for Polygon testing)
cd apps/smart-contracts/polygon
pnpm hardhat node

# Start local Solana network
solana-test-validator

# Deploy contracts to local networks
pnpm contracts:deploy:local

# Update environment variables to use local networks
POLYGON_RPC_URL=http://localhost:8545
SOLANA_RPC_URL=http://localhost:8899
```

### Q: Why are my blockchain transactions failing?

**A:** Common causes and solutions:

1. **Insufficient Funds**: Ensure wallet has enough tokens for gas fees
2. **Network Issues**: Check RPC endpoint connectivity
3. **Gas Price Too Low**: Increase gas price for faster confirmation
4. **Nonce Issues**: Check account nonce and transaction ordering
5. **Contract Errors**: Review contract code and function parameters

```bash
# Check account balance
cast balance $WALLET_ADDRESS --rpc-url $POLYGON_RPC_URL

# Check gas price
cast gas-price --rpc-url $POLYGON_RPC_URL

# Check transaction status
cast tx $TX_HASH --rpc-url $POLYGON_RPC_URL
```

### Q: How do I handle different wallet providers?

**A:** The application uses WalletConnect v2 for universal wallet support:

```typescript
// Supported wallet providers
const walletProviders = [
  'MetaMask',
  'WalletConnect',
  'Coinbase Wallet',
  'Trust Wallet',
  'Rainbow',
  // Add more as needed
];

// Configuration
const walletConnectConfig = {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  chains: [1, 137, 56], // Ethereum, Polygon, BSC
  methods: ['eth_sendTransaction', 'personal_sign'],
};
```

## 🧪 Testing

### Q: How do I run tests for specific parts of the application?

**A:** Use targeted test commands:

```bash
# Run tests for specific package
pnpm --filter @todo/web test

# Run specific test file
pnpm test todo.service.spec.ts

# Run tests matching pattern
pnpm test --testNamePattern="Todo"

# Run tests for changed files only
pnpm test --onlyChanged

# Run tests with coverage
pnpm test:coverage
```

### Q: How do I test blockchain functionality?

**A:** Use the blockchain testing setup:

```bash
# Test smart contracts
cd apps/smart-contracts/polygon
pnpm test

# Test blockchain services
pnpm --filter @todo/api test blockchain

# Run E2E tests with blockchain
pnpm test:e2e --grep "blockchain"

# Test with local blockchain networks
pnpm test:blockchain:local
```

### Q: How do I mock external services in tests?

**A:** Use the provided mock utilities:

```typescript
// Mock blockchain service
jest.mock('@todo/services/blockchain', () => ({
  BlockchainService: {
    createTodo: jest.fn().mockResolvedValue({
      transactionHash: '0x123...',
      status: 'confirmed',
    }),
  },
}));

// Mock API calls
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/api/todos', (req, res, ctx) => {
    return res(ctx.json({ id: '1', title: 'Test Todo' }));
  }),
);
```

### Q: Why are my E2E tests flaky?

**A:** Common causes and solutions:

1. **Race Conditions**: Add proper wait conditions
2. **Network Delays**: Increase timeouts for network requests
3. **Database State**: Ensure clean database state between tests
4. **Browser Issues**: Use consistent browser configuration
5. **Async Operations**: Properly wait for async operations to complete

```typescript
// Good practices for stable E2E tests
await page.waitForSelector('[data-testid=todo-item]');
await page.waitForLoadState('networkidle');
await expect(page.locator('[data-testid=todo-list]')).toBeVisible();
```

## 🚀 Deployment

### Q: How do I deploy to different environments?

**A:** Use environment-specific configurations:

```bash
# Development deployment
pnpm build:dev
pnpm deploy:dev

# Staging deployment
pnpm build:staging
pnpm deploy:staging

# Production deployment
pnpm build:production
pnpm deploy:production
```

Each environment has its own:

- Environment variables
- Database connections
- Blockchain network configurations
- Resource limits

### Q: How do I set up CI/CD for the monorepo?

**A:** The repository includes GitHub Actions workflows:

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: pnpm deploy:production
```

### Q: How do I scale the application?

**A:** Use Kubernetes horizontal pod autoscaling:

```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Q: How do I monitor the application in production?

**A:** Use the built-in monitoring stack:

- **Metrics**: Prometheus metrics at `/metrics`
- **Health Checks**: Health endpoints at `/health`
- **Tracing**: Jaeger for distributed tracing
- **Logs**: Structured JSON logging
- **Alerts**: Grafana alerting rules

```bash
# Check application health
curl https://api.todo-app.com/health

# View metrics
curl https://api.todo-app.com/metrics

# Check specific service health
kubectl get pods -n todo-app
kubectl logs -f deployment/api-deployment -n todo-app
```

## 🔐 Security

### Q: How is authentication handled?

**A:** The application uses multiple authentication methods:

1. **JWT Authentication**: For traditional email/password login
2. **Wallet Authentication**: For blockchain-based authentication
3. **OAuth**: For social login (future feature)

```typescript
// JWT flow
POST /auth/login -> { accessToken, refreshToken }
Authorization: Bearer <accessToken>

// Wallet flow
POST /auth/wallet/connect -> { signature, address }
POST /auth/wallet/verify -> { accessToken, refreshToken }
```

### Q: How are API endpoints secured?

**A:** Multiple security layers:

- **Authentication**: JWT tokens required for protected endpoints
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Prevent abuse with rate limits
- **Input Validation**: Comprehensive request validation
- **CORS**: Cross-origin request protection

```typescript
@Controller('todos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER)
export class TodoController {
  @Post()
  @RateLimit(10, 60) // 10 requests per minute
  async create(@Body() dto: CreateTodoDto) {
    // Implementation
  }
}
```

### Q: How is sensitive data protected?

**A:** Data protection measures:

- **Encryption at Rest**: Database encryption enabled
- **Encryption in Transit**: TLS/SSL for all communications
- **Environment Variables**: Secrets stored in environment variables
- **Key Management**: Separate key management for different environments
- **Data Sanitization**: PII removed from logs and error messages

### Q: How do I report security vulnerabilities?

**A:** Follow responsible disclosure:

1. **Email**: Send details to security@todo-app.com
2. **Encryption**: Use PGP key if available
3. **Details**: Include reproduction steps and impact assessment
4. **Timeline**: Allow reasonable time for fix before public disclosure

## 📱 Mobile Development

### Q: How do I test the mobile app on different devices?

**A:** Use Expo's testing capabilities:

```bash
# Test on iOS simulator
npx expo run:ios

# Test on Android emulator
npx expo run:android

# Test on physical device
npx expo start
# Scan QR code with Expo Go app

# Test on multiple devices simultaneously
npx expo start --tunnel
```

### Q: How do I add native modules to the mobile app?

**A:** Follow Expo's development build process:

```bash
# Install native module
cd apps/mobile
npx expo install react-native-camera

# Create development build
npx expo run:ios --device
npx expo run:android --device

# Or use EAS Build for cloud builds
npx eas build --platform ios
npx eas build --platform android
```

### Q: How do I handle different screen sizes and orientations?

**A:** Use responsive design patterns:

```typescript
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isIOS = Platform.OS === 'ios';

// Responsive styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: isTablet ? 24 : 16,
  },
  text: {
    fontSize: isTablet ? 18 : 16,
  },
});
```

## 🔧 Performance

### Q: How do I optimize build performance?

**A:** Use these optimization techniques:

```bash
# Use Turborepo caching
pnpm build # Subsequent builds will be faster

# Parallel builds
pnpm build --parallel

# Skip unnecessary builds
pnpm build --filter="[HEAD^1]" # Only changed packages

# Use remote caching
npx turbo login
npx turbo link
```

### Q: How do I optimize runtime performance?

**A:** Follow performance best practices:

1. **Code Splitting**: Dynamic imports for large components
2. **Caching**: Redis caching for API responses
3. **Database Optimization**: Proper indexes and query optimization
4. **CDN**: Static asset delivery via CDN
5. **Compression**: Gzip/Brotli compression enabled

```typescript
// Code splitting example
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false,
});

// API caching example
@Cacheable(300) // Cache for 5 minutes
async getTodos(userId: string): Promise<Todo[]> {
  return this.todoRepository.findByUserId(userId);
}
```

### Q: How do I monitor performance?

**A:** Use built-in monitoring tools:

- **Web Vitals**: Core Web Vitals monitoring in web app
- **API Metrics**: Response time and throughput metrics
- **Database Performance**: Query performance monitoring
- **Resource Usage**: CPU and memory monitoring

```bash
# Check performance metrics
curl http://localhost:3001/metrics | grep http_request_duration

# Monitor database performance
mongosh --eval "db.runCommand({serverStatus: 1})"

# Check resource usage
kubectl top pods -n todo-app
```

## 🤝 Contributing

### Q: How do I contribute to the project?

**A:** Follow the contribution workflow:

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Add** tests for new functionality
5. **Run** tests and linting
6. **Submit** a pull request

```bash
git checkout -b feature/my-new-feature
# Make changes
pnpm test
pnpm lint
git commit -m "feat: add new feature"
git push origin feature/my-new-feature
```

### Q: What are the coding standards?

**A:** Follow these standards:

- **TypeScript**: Use strict mode TypeScript
- **ESLint**: Follow configured ESLint rules
- **Prettier**: Use Prettier for code formatting
- **Conventional Commits**: Use conventional commit messages
- **Testing**: Write tests for new functionality
- **Documentation**: Update documentation for changes

### Q: How do I set up the development environment?

**A:** Follow the setup guide:

```bash
# Clone repository
git clone https://github.com/your-org/todo-list-turborepo.git
cd todo-list-turborepo

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Start databases
docker compose up -d mongodb redis

# Run database setup
pnpm db:setup

# Start development servers
pnpm dev
```

## 📞 Support

### Q: Where can I get help?

**A:** Multiple support channels available:

- **Documentation**: Check `/docs` directory
- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions and discuss ideas
- **Discord**: Join the community chat
- **Email**: Contact support@todo-app.com

### Q: How do I report bugs?

**A:** Create detailed bug reports:

1. **Search** existing issues first
2. **Use** the bug report template
3. **Include** reproduction steps
4. **Provide** environment details
5. **Add** relevant logs and screenshots

### Q: How do I request new features?

**A:** Submit feature requests:

1. **Check** existing feature requests
2. **Use** the feature request template
3. **Describe** the use case and benefits
4. **Provide** mockups or examples if applicable
5. **Discuss** implementation approach

---

## 📚 Additional Resources

- **[API Gateway Architecture](../api/gateway/02-target-architecture.md)** - System design and gateway patterns
- **[Bun + Elysia API Guide](../api/bun-elysia-api-guide.md)** - Bun API technical reference
- **[Testing Guide](../testing/testing-strategy.md)** - Testing strategies and examples
- **[Deployment Guide](../deployment/deployment-guide.md)** - Production deployment instructions
- **[Troubleshooting Guide](./troubleshooting.md)** - Common issues and solutions
- **[Contributing Guide](../../CONTRIBUTING.md)** - How to contribute to the project

---

**Can't find what you're looking for?** [Create an issue](https://github.com/your-org/todo-list-turborepo/issues/new) or [start a discussion](https://github.com/your-org/todo-list-turborepo/discussions/new)!
