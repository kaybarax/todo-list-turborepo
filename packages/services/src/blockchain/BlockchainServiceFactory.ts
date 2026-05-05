import { BlockchainError } from '@todo/utils/blockchain/errors';

import {
  BaseNetworkBlockchainService,
  type BaseNetworkBlockchainServiceOptions,
} from './implementations/BaseNetworkBlockchainService';
import {
  MoonbeamBlockchainService,
  type MoonbeamBlockchainServiceOptions,
} from './implementations/MoonbeamBlockchainService';
import { PolkadotBlockchainService } from './implementations/PolkadotBlockchainService';
import {
  PolygonBlockchainService,
  type PolygonBlockchainServiceOptions,
} from './implementations/PolygonBlockchainService';
import { SolanaBlockchainService } from './implementations/SolanaBlockchainService';
import { type BlockchainService } from './interfaces/BlockchainService';
import { BlockchainNetwork } from './types';

/**
 * Configuration for blockchain services
 */
export interface BlockchainServiceConfig {
  /** Polygon configuration */
  polygon?: {
    /** Mumbai testnet configuration */
    mumbai?: PolygonBlockchainServiceOptions;
    /** Mainnet configuration */
    mainnet?: PolygonBlockchainServiceOptions;
  };
  /** Solana configuration */
  solana?: {
    /** Devnet configuration */
    devnet?: {
      rpcUrl?: string;
      commitment?: string;
    };
    /** Mainnet configuration */
    mainnet?: {
      rpcUrl?: string;
      commitment?: string;
    };
  };
  /** Polkadot configuration */
  polkadot?: {
    /** Testnet configuration */
    testnet?: {
      wsEndpoint?: string;
      chainName?: string;
    };
    /** Mainnet configuration */
    mainnet?: {
      wsEndpoint?: string;
      chainName?: string;
    };
  };
  /** Moonbeam configuration */
  moonbeam?: {
    /** Testnet configuration */
    testnet?: MoonbeamBlockchainServiceOptions;
    /** Mainnet configuration */
    mainnet?: MoonbeamBlockchainServiceOptions;
  };
  /** Base configuration */
  base?: {
    /** Testnet configuration */
    testnet?: BaseNetworkBlockchainServiceOptions;
    /** Mainnet configuration */
    mainnet?: BaseNetworkBlockchainServiceOptions;
  };
}

/**
 * Factory for creating blockchain services
 */
export class BlockchainServiceFactory {
  private config: BlockchainServiceConfig;
  private services: Map<BlockchainNetwork, BlockchainService> = new Map();

  /**
   * Create a new BlockchainServiceFactory
   * @param config - Configuration for blockchain services
   */
  constructor(config: BlockchainServiceConfig) {
    this.config = config;
  }

  /**
   * Get a blockchain service for the specified network
   * @param network - Blockchain network
   * @returns Blockchain service instance
   * @throws Error if the network is not supported or configured
   */
  getService(network: BlockchainNetwork): BlockchainService {
    // Check if service is already created
    const existingService = this.services.get(network);
    if (existingService) {
      return existingService;
    }

    // Create a new service based on the network
    let service: BlockchainService;

    switch (network) {
      case BlockchainNetwork.POLYGON:
        if (!this.config.polygon?.mainnet) {
          throw new Error('Polygon mainnet configuration is missing');
        }
        service = new PolygonBlockchainService(this.config.polygon.mainnet);
        break;

      case BlockchainNetwork.POLYGON_MUMBAI:
        if (!this.config.polygon?.mumbai) {
          throw new Error('Polygon Mumbai configuration is missing');
        }
        service = new PolygonBlockchainService(this.config.polygon.mumbai);
        break;

      case BlockchainNetwork.SOLANA:
        service = new SolanaBlockchainService(network);
        break;

      case BlockchainNetwork.SOLANA_DEVNET:
        service = new SolanaBlockchainService(network);
        break;

      case BlockchainNetwork.POLKADOT:
        service = new PolkadotBlockchainService(network);
        break;

      case BlockchainNetwork.POLKADOT_TESTNET:
        service = new PolkadotBlockchainService(network);
        break;

      case BlockchainNetwork.MOONBEAM:
        if (!this.config.moonbeam?.mainnet) {
          throw BlockchainError.networkError('Moonbeam mainnet configuration is missing', undefined, network);
        }
        service = new MoonbeamBlockchainService(this.config.moonbeam.mainnet);
        break;

      case BlockchainNetwork.MOONBEAM_TESTNET:
        if (!this.config.moonbeam?.testnet) {
          throw BlockchainError.networkError('Moonbeam testnet configuration is missing', undefined, network);
        }
        service = new MoonbeamBlockchainService(this.config.moonbeam.testnet);
        break;

      case BlockchainNetwork.BASE:
        if (!this.config.base?.mainnet) {
          throw BlockchainError.networkError('Base mainnet configuration is missing', undefined, network);
        }
        service = new BaseNetworkBlockchainService(this.config.base.mainnet);
        break;

      case BlockchainNetwork.BASE_TESTNET:
        if (!this.config.base?.testnet) {
          throw BlockchainError.networkError('Base testnet configuration is missing', undefined, network);
        }
        service = new BaseNetworkBlockchainService(this.config.base.testnet);
        break;

      default:
        throw BlockchainError.networkError(`Unsupported blockchain network: ${network}`, undefined, network);
    }

    // Cache the service
    this.services.set(network, service);
    return service;
  }

  /**
   * Get all configured blockchain services
   * @returns Array of blockchain services
   */
  getAllServices(): BlockchainService[] {
    const services: BlockchainService[] = [];

    // Polygon
    if (this.config.polygon?.mainnet) {
      services.push(this.getService(BlockchainNetwork.POLYGON));
    }
    if (this.config.polygon?.mumbai) {
      services.push(this.getService(BlockchainNetwork.POLYGON_MUMBAI));
    }

    // Solana
    if (this.config.solana?.mainnet) {
      services.push(this.getService(BlockchainNetwork.SOLANA));
    }
    if (this.config.solana?.devnet) {
      services.push(this.getService(BlockchainNetwork.SOLANA_DEVNET));
    }

    // Polkadot
    if (this.config.polkadot?.mainnet) {
      services.push(this.getService(BlockchainNetwork.POLKADOT));
    }
    if (this.config.polkadot?.testnet) {
      services.push(this.getService(BlockchainNetwork.POLKADOT_TESTNET));
    }

    // Moonbeam
    if (this.config.moonbeam?.mainnet) {
      services.push(this.getService(BlockchainNetwork.MOONBEAM));
    }
    if (this.config.moonbeam?.testnet) {
      services.push(this.getService(BlockchainNetwork.MOONBEAM_TESTNET));
    }

    // Base
    if (this.config.base?.mainnet) {
      services.push(this.getService(BlockchainNetwork.BASE));
    }
    if (this.config.base?.testnet) {
      services.push(this.getService(BlockchainNetwork.BASE_TESTNET));
    }

    return services;
  }

  /**
   * Get all supported networks that are configured
   * @returns Array of supported blockchain networks
   */
  getSupportedNetworks(): BlockchainNetwork[] {
    const networks: BlockchainNetwork[] = [];

    // Polygon
    if (this.config.polygon?.mainnet) {
      networks.push(BlockchainNetwork.POLYGON);
    }
    if (this.config.polygon?.mumbai) {
      networks.push(BlockchainNetwork.POLYGON_MUMBAI);
    }

    // Solana
    if (this.config.solana?.mainnet) {
      networks.push(BlockchainNetwork.SOLANA);
    }
    if (this.config.solana?.devnet) {
      networks.push(BlockchainNetwork.SOLANA_DEVNET);
    }

    // Polkadot
    if (this.config.polkadot?.mainnet) {
      networks.push(BlockchainNetwork.POLKADOT);
    }
    if (this.config.polkadot?.testnet) {
      networks.push(BlockchainNetwork.POLKADOT_TESTNET);
    }

    // Moonbeam
    if (this.config.moonbeam?.mainnet) {
      networks.push(BlockchainNetwork.MOONBEAM);
    }
    if (this.config.moonbeam?.testnet) {
      networks.push(BlockchainNetwork.MOONBEAM_TESTNET);
    }

    // Base
    if (this.config.base?.mainnet) {
      networks.push(BlockchainNetwork.BASE);
    }
    if (this.config.base?.testnet) {
      networks.push(BlockchainNetwork.BASE_TESTNET);
    }

    return networks;
  }
}
