import { TransactionStatus, type TransactionReceipt } from '@todo/utils/blockchain';
import { getEnvVar } from '@todo/utils/common/env';
import { z } from 'zod';

// Re-export types from utils for convenience
export { TransactionStatus, type TransactionReceipt };

/**
 * Supported blockchain networks
 */

export enum BlockchainNetwork {
  POLYGON = 'polygon',
  POLYGON_MUMBAI = 'polygon_mumbai',
  SOLANA = 'solana',
  SOLANA_DEVNET = 'solana_devnet',
  POLKADOT = 'polkadot',
  POLKADOT_TESTNET = 'polkadot_testnet',
  MOONBEAM = 'moonbeam',
  MOONBEAM_TESTNET = 'moonbeam_testnet',
  BASE = 'base',
  BASE_TESTNET = 'base_testnet',
}

// TransactionStatus is re-exported from @todo/utils/blockchain/monitoring

/**
 * Todo status on blockchain
 */

export enum BlockchainTodoStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

/**
 * Schema for wallet information
 */
export const walletInfoSchema = z.object({
  address: z.string(),
  network: z.nativeEnum(BlockchainNetwork),
  balance: z.string().optional(),
  isConnected: z.boolean().default(true),
  chainId: z.string().or(z.number()).optional(),
  publicKey: z.string().optional(),
});

/**
 * Type for wallet information
 */
export type WalletInfo = z.infer<typeof walletInfoSchema>;

/**
 * Schema for transaction receipt
 */
export const transactionReceiptSchema = z.object({
  transactionHash: z.string(),
  blockNumber: z.number().optional(),
  blockHash: z.string().optional(),
  timestamp: z.date().optional(),
  status: z.nativeEnum(TransactionStatus),
  from: z.string(),
  to: z.string().optional(),
  gasUsed: z.string().or(z.number()).optional(),
  effectiveGasPrice: z.string().or(z.number()).optional(),
  network: z.nativeEnum(BlockchainNetwork),
  fee: z.string().optional(),
});

// TransactionReceipt type is re-exported from @todo/utils/blockchain/monitoring

/**
 * Schema for blockchain todo
 */
export const blockchainTodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.nativeEnum(BlockchainTodoStatus).default(BlockchainTodoStatus.TODO),
  completed: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  owner: z.string(),
  transactionHash: z.string().optional(),
  network: z.nativeEnum(BlockchainNetwork),
});

/**
 * Type for blockchain todo
 */
export type BlockchainTodo = z.infer<typeof blockchainTodoSchema>;

/**
 * Schema for creating a blockchain todo
 */
export const createBlockchainTodoSchema = blockchainTodoSchema.omit({
  id: true,
  owner: true,
  transactionHash: true,
  network: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Type for creating a blockchain todo
 */
export type CreateBlockchainTodoInput = z.infer<typeof createBlockchainTodoSchema>;

/**
 * Schema for updating a blockchain todo
 */
export const updateBlockchainTodoSchema = createBlockchainTodoSchema.partial();

/**
 * Type for updating a blockchain todo
 */
export type UpdateBlockchainTodoInput = z.infer<typeof updateBlockchainTodoSchema>;

/**
 * Error types for blockchain operations
 */

export enum BlockchainErrorType {
  WALLET_CONNECTION_FAILED = 'wallet_connection_failed',
  WALLET_NOT_CONNECTED = 'wallet_not_connected',
  TRANSACTION_FAILED = 'transaction_failed',
  NETWORK_ERROR = 'network_error',
  CONTRACT_ERROR = 'contract_error',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  USER_REJECTED = 'user_rejected',
  UNKNOWN_ERROR = 'unknown_error',
  // Moonbeam-specific errors
  MOONBEAM_CONNECTION_FAILED = 'moonbeam_connection_failed',
  MOONBEAM_SUBSTRATE_ERROR = 'moonbeam_substrate_error',
  MOONBEAM_EVM_ERROR = 'moonbeam_evm_error',
  // Base-specific errors
  BASE_L2_ERROR = 'base_l2_error',
  BASE_SEQUENCER_ERROR = 'base_sequencer_error',
  BASE_BRIDGE_ERROR = 'base_bridge_error',
  // General network switching errors
  NETWORK_SWITCH_REQUIRED = 'network_switch_required',
  UNSUPPORTED_WALLET = 'unsupported_wallet',
}

/**
 * Schema for blockchain error
 */
export const blockchainErrorSchema = z.object({
  type: z.nativeEnum(BlockchainErrorType),
  message: z.string(),
  originalError: z.unknown().optional(),
  transactionHash: z.string().optional(),
  network: z.nativeEnum(BlockchainNetwork).optional(),
});

/**
 * Type for blockchain error
 */
export type BlockchainError = z.infer<typeof blockchainErrorSchema>;

/**
 * Schema for network configuration
 */
export const networkConfigSchema = z.object({
  name: z.string(),
  chainId: z.number(),
  rpcUrl: z.string().url(),
  explorerUrl: z.string().url(),
  nativeCurrency: z.object({
    name: z.string(),
    symbol: z.string(),
    decimals: z.number(),
  }),
  contractAddresses: z.object({
    todoListFactory: z.string().optional(),
    todoList: z.string().optional(),
  }),
  isTestnet: z.boolean().default(false),
  isEVM: z.boolean().default(false),
});

/**
 * Type for network configuration
 */
export type NetworkConfig = z.infer<typeof networkConfigSchema>;

/**
 * Schema for EVM-compatible network service options
 */
export const evmServiceOptionsSchema = z.object({
  rpcUrl: z.string().url(),
  chainId: z.number(),
  contractAddresses: z.object({
    todoListFactory: z.string(),
    todoList: z.string().optional(),
  }),
  gasLimit: z.number().optional(),
  gasPrice: z.string().optional(),
  maxFeePerGas: z.string().optional(),
  maxPriorityFeePerGas: z.string().optional(),
});

/**
 * Type for EVM-compatible network service options
 */
export type EVMServiceOptions = z.infer<typeof evmServiceOptionsSchema>;

/**
 * All network configurations
 */
export const NETWORK_CONFIGS: Record<BlockchainNetwork, NetworkConfig> = {
  // Existing networks (these would need to be defined elsewhere or imported)
  [BlockchainNetwork.POLYGON]: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: getEnvVar('POLYGON_RPC_URL', 'https://polygon-rpc.com'),
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    contractAddresses: { todoListFactory: getEnvVar('POLYGON_TODO_FACTORY_ADDRESS') },
    isTestnet: false,
    isEVM: true,
  },
  [BlockchainNetwork.POLYGON_MUMBAI]: {
    name: 'Polygon Mumbai',
    chainId: 80001,
    rpcUrl: getEnvVar('POLYGON_MUMBAI_RPC_URL', 'https://rpc-mumbai.maticvigil.com'),
    explorerUrl: 'https://mumbai.polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    contractAddresses: { todoListFactory: getEnvVar('POLYGON_MUMBAI_TODO_FACTORY_ADDRESS') },
    isTestnet: true,
    isEVM: true,
  },
  [BlockchainNetwork.SOLANA]: {
    name: 'Solana',
    chainId: 101, // Solana doesn't use chain IDs like EVM, but we'll use cluster ID
    rpcUrl: getEnvVar('SOLANA_RPC_URL', 'https://api.mainnet-beta.solana.com'),
    explorerUrl: 'https://explorer.solana.com',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    contractAddresses: { todoListFactory: getEnvVar('SOLANA_PROGRAM_ID') },
    isTestnet: false,
    isEVM: false,
  },
  [BlockchainNetwork.SOLANA_DEVNET]: {
    name: 'Solana Devnet',
    chainId: 103,
    rpcUrl: getEnvVar('SOLANA_DEVNET_RPC_URL', 'https://api.devnet.solana.com'),
    explorerUrl: 'https://explorer.solana.com?cluster=devnet',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    contractAddresses: { todoListFactory: getEnvVar('SOLANA_DEVNET_PROGRAM_ID') },
    isTestnet: true,
    isEVM: false,
  },
  [BlockchainNetwork.POLKADOT]: {
    name: 'Polkadot',
    chainId: 0, // Polkadot doesn't use chain IDs
    rpcUrl: getEnvVar('POLKADOT_RPC_URL', 'wss://rpc.polkadot.io'),
    explorerUrl: 'https://polkadot.subscan.io',
    nativeCurrency: { name: 'Polkadot', symbol: 'DOT', decimals: 10 },
    contractAddresses: { todoListFactory: '' }, // Polkadot uses pallets, not contracts
    isTestnet: false,
    isEVM: false,
  },
  [BlockchainNetwork.POLKADOT_TESTNET]: {
    name: 'Westend',
    chainId: 0,
    rpcUrl: getEnvVar('POLKADOT_TESTNET_RPC_URL', 'wss://westend-rpc.polkadot.io'),
    explorerUrl: 'https://westend.subscan.io',
    nativeCurrency: { name: 'Westend', symbol: 'WND', decimals: 12 },
    contractAddresses: { todoListFactory: '' },
    isTestnet: true,
    isEVM: false,
  },
  // New networks - Moonbeam
  [BlockchainNetwork.MOONBEAM]: {
    name: 'Moonbeam',
    chainId: 1284,
    rpcUrl: getEnvVar('MOONBEAM_RPC_URL', 'https://rpc.api.moonbeam.network'),
    explorerUrl: 'https://moonscan.io',
    nativeCurrency: {
      name: 'Glimmer',
      symbol: 'GLMR',
      decimals: 18,
    },
    contractAddresses: {
      todoListFactory: getEnvVar('MOONBEAM_TODO_FACTORY_ADDRESS'),
    },
    isTestnet: false,
    isEVM: true,
  },
  [BlockchainNetwork.MOONBEAM_TESTNET]: {
    name: 'Moonbase Alpha',
    chainId: 1287,
    rpcUrl: getEnvVar('MOONBEAM_TESTNET_RPC_URL', 'https://rpc.api.moonbase.moonbeam.network'),
    explorerUrl: 'https://moonbase.moonscan.io',
    nativeCurrency: {
      name: 'Dev',
      symbol: 'DEV',
      decimals: 18,
    },
    contractAddresses: {
      todoListFactory: getEnvVar('MOONBEAM_TESTNET_TODO_FACTORY_ADDRESS'),
    },
    isTestnet: true,
    isEVM: true,
  },
  // New networks - Base
  [BlockchainNetwork.BASE]: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: getEnvVar('BASE_RPC_URL', 'https://mainnet.base.org'),
    explorerUrl: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    contractAddresses: {
      todoListFactory: getEnvVar('BASE_TODO_FACTORY_ADDRESS'),
    },
    isTestnet: false,
    isEVM: true,
  },
  [BlockchainNetwork.BASE_TESTNET]: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: getEnvVar('BASE_TESTNET_RPC_URL', 'https://sepolia.base.org'),
    explorerUrl: 'https://sepolia.basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    contractAddresses: {
      todoListFactory: getEnvVar('BASE_TESTNET_TODO_FACTORY_ADDRESS'),
    },
    isTestnet: true,
    isEVM: true,
  },
};

/**
 * Helper function to get network configuration
 */
export function getNetworkConfig(network: BlockchainNetwork): NetworkConfig {
  const config = NETWORK_CONFIGS[network];
  if (!config) {
    throw new Error(`Network configuration not found for ${network}`);
  }
  return config;
}

/**
 * Helper function to check if network is EVM compatible
 */
export function isEVMNetwork(network: BlockchainNetwork): boolean {
  return getNetworkConfig(network).isEVM;
}

/**
 * Helper function to check if network is testnet
 */
export function isTestnetNetwork(network: BlockchainNetwork): boolean {
  return getNetworkConfig(network).isTestnet;
}

/**
 * Helper function to get all EVM networks
 */
export function getEVMNetworks(): BlockchainNetwork[] {
  return Object.keys(NETWORK_CONFIGS).filter(
    network => NETWORK_CONFIGS[network as BlockchainNetwork].isEVM,
  ) as BlockchainNetwork[];
}

/**
 * Helper function to get all mainnet networks
 */
export function getMainnetNetworks(): BlockchainNetwork[] {
  return Object.keys(NETWORK_CONFIGS).filter(
    network => !NETWORK_CONFIGS[network as BlockchainNetwork].isTestnet,
  ) as BlockchainNetwork[];
}

/**
 * Helper function to get all testnet networks
 */
export function getTestnetNetworks(): BlockchainNetwork[] {
  return Object.keys(NETWORK_CONFIGS).filter(
    network => NETWORK_CONFIGS[network as BlockchainNetwork].isTestnet,
  ) as BlockchainNetwork[];
}
