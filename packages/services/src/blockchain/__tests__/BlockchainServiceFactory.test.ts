// @ts-nocheck
import { BlockchainServiceFactory } from '../BlockchainServiceFactory';
import { BlockchainNetwork } from '../types';
import { PolygonBlockchainService } from '../implementations/PolygonBlockchainService';
import { SolanaBlockchainService } from '../implementations/SolanaBlockchainService';
import { PolkadotBlockchainService } from '../implementations/PolkadotBlockchainService';
import { MoonbeamBlockchainService } from '../implementations/MoonbeamBlockchainService';
import { BaseNetworkBlockchainService } from '../implementations/BaseNetworkBlockchainService';

describe('BlockchainServiceFactory', () => {
  const mockConfig = {
    polygon: {
      mumbai: {
        todoListFactoryAddress: '0x1234567890123456789012345678901234567890',
        rpcUrl: 'https://rpc-mumbai.maticvigil.com',
        chainId: 80001,
        explorerBaseUrl: 'https://mumbai.polygonscan.com',
      },
      mainnet: {
        todoListFactoryAddress: '0x0987654321098765432109876543210987654321',
        rpcUrl: 'https://polygon-rpc.com',
        chainId: 137,
        explorerBaseUrl: 'https://polygonscan.com',
      },
    },
    solana: {
      mainnet: {
        rpcUrl: 'https://api.mainnet-beta.solana.com',
        commitment: 'confirmed',
      },
      devnet: {
        rpcUrl: 'https://api.devnet.solana.com',
        commitment: 'confirmed',
      },
    },
    polkadot: {
      mainnet: {
        wsEndpoint: 'wss://rpc.polkadot.io',
        chainName: 'polkadot',
      },
      testnet: {
        wsEndpoint: 'wss://westend-rpc.polkadot.io',
        chainName: 'westend',
      },
    },
    moonbeam: {
      mainnet: {
        todoListFactoryAddress: '0x1111111111111111111111111111111111111111',
        rpcUrl: 'https://rpc.api.moonbeam.network',
        chainId: 1284,
        explorerBaseUrl: 'https://moonscan.io',
      },
      testnet: {
        todoListFactoryAddress: '0x2222222222222222222222222222222222222222',
        rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
        chainId: 1287,
        explorerBaseUrl: 'https://moonbase.moonscan.io',
      },
    },
    base: {
      mainnet: {
        todoListFactoryAddress: '0x3333333333333333333333333333333333333333',
        rpcUrl: 'https://mainnet.base.org',
        chainId: 8453,
        explorerBaseUrl: 'https://basescan.org',
      },
      testnet: {
        todoListFactoryAddress: '0x4444444444444444444444444444444444444444',
        rpcUrl: 'https://sepolia.base.org',
        chainId: 84532,
        explorerBaseUrl: 'https://sepolia.basescan.org',
      },
    },
  };

  it('should create a factory with the provided configuration', () => {
    const factory = new BlockchainServiceFactory(mockConfig);
    expect(factory).toBeDefined();
  });

  it('should return a Polygon service for Mumbai network', () => {
    const factory = new BlockchainServiceFactory(mockConfig);
    const service = factory.getService(BlockchainNetwork.POLYGON_MUMBAI);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(PolygonBlockchainService);
    expect(service.getNetwork()).toBe(BlockchainNetwork.POLYGON_MUMBAI);
  });

  it('should return a Polygon service for Polygon mainnet', () => {
    const factory = new BlockchainServiceFactory(mockConfig);
    const service = factory.getService(BlockchainNetwork.POLYGON);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(PolygonBlockchainService);
    expect(service.getNetwork()).toBe(BlockchainNetwork.POLYGON);
  });

  it('should return a Solana service for Solana mainnet', () => {
    const factory = new BlockchainServiceFactory(mockConfig);
    const service = factory.getService(BlockchainNetwork.SOLANA);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(SolanaBlockchainService);
    expect(service.getNetwork()).toBe(BlockchainNetwork.SOLANA);
  });

  it('should return a Solana service for Solana devnet', () => {
    const factory = new BlockchainServiceFactory(mockConfig);
    const service = factory.getService(BlockchainNetwork.SOLANA_DEVNET);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(SolanaBlockchainService);
    expect(service.getNetwork()).toBe(BlockchainNetwork.SOLANA_DEVNET);
  });

  it('should return a Polkadot service for Polkadot mainnet', () => {
    const factory = new BlockchainServiceFactory(mockConfig);
    const service = factory.getService(BlockchainNetwork.POLKADOT);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(PolkadotBlockchainService);
    expect(service.getNetwork()).toBe(BlockchainNetwork.POLKADOT);
  });

  it('should return a Polkadot service for Polkadot testnet', () => {
    const factory = new BlockchainServiceFactory(mockConfig);
    const service = factory.getService(BlockchainNetwork.POLKADOT_TESTNET);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(PolkadotBlockchainService);
    expect(service.getNetwork()).toBe(BlockchainNetwork.POLKADOT_TESTNET);
  });

  it('should return the same instance for repeated calls', () => {
    const factory = new BlockchainServiceFactory(mockConfig);

    const service1 = factory.getService(BlockchainNetwork.POLYGON_MUMBAI);
    const service2 = factory.getService(BlockchainNetwork.POLYGON_MUMBAI);

    expect(service1).toBe(service2);
  });

  it('should return a Moonbeam service for Moonbeam mainnet', () => {
    const factory = new BlockchainServiceFactory(mockConfig);
    const service = factory.getService(BlockchainNetwork.MOONBEAM);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(MoonbeamBlockchainService);
    expect(service.getNetwork()).toBe(BlockchainNetwork.MOONBEAM);
  });

  it('should return a Moonbeam service for Moonbeam testnet', () => {
    const factory = new BlockchainServiceFactory(mockConfig);
    const service = factory.getService(BlockchainNetwork.MOONBEAM_TESTNET);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(MoonbeamBlockchainService);
    expect(service.getNetwork()).toBe(BlockchainNetwork.MOONBEAM_TESTNET);
  });

  it('should return a Base service for Base mainnet', () => {
    const factory = new BlockchainServiceFactory(mockConfig);
    const service = factory.getService(BlockchainNetwork.BASE);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(BaseNetworkBlockchainService);
    expect(service.getNetwork()).toBe(BlockchainNetwork.BASE);
  });

  it('should return a Base service for Base testnet', () => {
    const factory = new BlockchainServiceFactory(mockConfig);
    const service = factory.getService(BlockchainNetwork.BASE_TESTNET);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(BaseNetworkBlockchainService);
    expect(service.getNetwork()).toBe(BlockchainNetwork.BASE_TESTNET);
  });

  it('should return all supported networks', () => {
    const factory = new BlockchainServiceFactory(mockConfig);
    const networks = factory.getSupportedNetworks();

    expect(networks).toContain(BlockchainNetwork.POLYGON);
    expect(networks).toContain(BlockchainNetwork.POLYGON_MUMBAI);
    expect(networks).toContain(BlockchainNetwork.SOLANA);
    expect(networks).toContain(BlockchainNetwork.SOLANA_DEVNET);
    expect(networks).toContain(BlockchainNetwork.POLKADOT);
    expect(networks).toContain(BlockchainNetwork.POLKADOT_TESTNET);
    expect(networks).toContain(BlockchainNetwork.MOONBEAM);
    expect(networks).toContain(BlockchainNetwork.MOONBEAM_TESTNET);
    expect(networks).toContain(BlockchainNetwork.BASE);
    expect(networks).toContain(BlockchainNetwork.BASE_TESTNET);
    expect(networks).toHaveLength(10);
  });

  it('should return all services', () => {
    const factory = new BlockchainServiceFactory(mockConfig);
    const services = factory.getAllServices();

    expect(services).toHaveLength(10);

    const networkTypes = services.map(service => service.getNetwork());
    expect(networkTypes).toContain(BlockchainNetwork.POLYGON);
    expect(networkTypes).toContain(BlockchainNetwork.POLYGON_MUMBAI);
    expect(networkTypes).toContain(BlockchainNetwork.SOLANA);
    expect(networkTypes).toContain(BlockchainNetwork.SOLANA_DEVNET);
    expect(networkTypes).toContain(BlockchainNetwork.POLKADOT);
    expect(networkTypes).toContain(BlockchainNetwork.POLKADOT_TESTNET);
    expect(networkTypes).toContain(BlockchainNetwork.MOONBEAM);
    expect(networkTypes).toContain(BlockchainNetwork.MOONBEAM_TESTNET);
    expect(networkTypes).toContain(BlockchainNetwork.BASE);
    expect(networkTypes).toContain(BlockchainNetwork.BASE_TESTNET);
  });

  describe('error handling', () => {
    it('should throw error for unsupported network', () => {
      const factory = new BlockchainServiceFactory(mockConfig);

      expect(() => {
        factory.getService('UNSUPPORTED_NETWORK' as BlockchainNetwork);
      }).toThrow();
    });

    it('should throw error when Moonbeam mainnet config is missing', () => {
      const configWithoutMoonbeam = { ...mockConfig };
      delete configWithoutMoonbeam.moonbeam;

      const factory = new BlockchainServiceFactory(configWithoutMoonbeam);

      expect(() => {
        factory.getService(BlockchainNetwork.MOONBEAM);
      }).toThrow('Moonbeam mainnet configuration is missing');
    });

    it('should throw error when Moonbeam testnet config is missing', () => {
      const configWithoutMoonbeamTestnet = {
        ...mockConfig,
        moonbeam: {
          mainnet: mockConfig.moonbeam.mainnet,
        },
      };

      const factory = new BlockchainServiceFactory(configWithoutMoonbeamTestnet);

      expect(() => {
        factory.getService(BlockchainNetwork.MOONBEAM_TESTNET);
      }).toThrow('Moonbeam testnet configuration is missing');
    });

    it('should throw error when Base mainnet config is missing', () => {
      const configWithoutBase = { ...mockConfig };
      delete configWithoutBase.base;

      const factory = new BlockchainServiceFactory(configWithoutBase);

      expect(() => {
        factory.getService(BlockchainNetwork.BASE);
      }).toThrow('Base mainnet configuration is missing');
    });

    it('should throw error when Base testnet config is missing', () => {
      const configWithoutBaseTestnet = {
        ...mockConfig,
        base: {
          mainnet: mockConfig.base.mainnet,
        },
      };

      const factory = new BlockchainServiceFactory(configWithoutBaseTestnet);

      expect(() => {
        factory.getService(BlockchainNetwork.BASE_TESTNET);
      }).toThrow('Base testnet configuration is missing');
    });
  });

  describe('service caching', () => {
    it('should cache Moonbeam services', () => {
      const factory = new BlockchainServiceFactory(mockConfig);

      const service1 = factory.getService(BlockchainNetwork.MOONBEAM);
      const service2 = factory.getService(BlockchainNetwork.MOONBEAM);

      expect(service1).toBe(service2);
    });

    it('should cache Base services', () => {
      const factory = new BlockchainServiceFactory(mockConfig);

      const service1 = factory.getService(BlockchainNetwork.BASE);
      const service2 = factory.getService(BlockchainNetwork.BASE);

      expect(service1).toBe(service2);
    });

    it('should maintain separate caches for different networks', () => {
      const factory = new BlockchainServiceFactory(mockConfig);

      const moonbeamService = factory.getService(BlockchainNetwork.MOONBEAM);
      const baseService = factory.getService(BlockchainNetwork.BASE);

      expect(moonbeamService).not.toBe(baseService);
      expect(moonbeamService.getNetwork()).toBe(BlockchainNetwork.MOONBEAM);
      expect(baseService.getNetwork()).toBe(BlockchainNetwork.BASE);
    });
  });

  describe('partial configuration', () => {
    it('should work with only Moonbeam configuration', () => {
      const moonbeamOnlyConfig = {
        moonbeam: mockConfig.moonbeam,
      };

      const factory = new BlockchainServiceFactory(moonbeamOnlyConfig);
      const networks = factory.getSupportedNetworks();

      expect(networks).toContain(BlockchainNetwork.MOONBEAM);
      expect(networks).toContain(BlockchainNetwork.MOONBEAM_TESTNET);
      expect(networks).toHaveLength(2);
    });

    it('should work with only Base configuration', () => {
      const baseOnlyConfig = {
        base: mockConfig.base,
      };

      const factory = new BlockchainServiceFactory(baseOnlyConfig);
      const networks = factory.getSupportedNetworks();

      expect(networks).toContain(BlockchainNetwork.BASE);
      expect(networks).toContain(BlockchainNetwork.BASE_TESTNET);
      expect(networks).toHaveLength(2);
    });

    it('should work with mixed configuration', () => {
      const mixedConfig = {
        polygon: mockConfig.polygon,
        moonbeam: {
          mainnet: mockConfig.moonbeam.mainnet,
        },
        base: {
          testnet: mockConfig.base.testnet,
        },
      };

      const factory = new BlockchainServiceFactory(mixedConfig);
      const networks = factory.getSupportedNetworks();

      expect(networks).toContain(BlockchainNetwork.POLYGON);
      expect(networks).toContain(BlockchainNetwork.POLYGON_MUMBAI);
      expect(networks).toContain(BlockchainNetwork.MOONBEAM);
      expect(networks).toContain(BlockchainNetwork.BASE_TESTNET);
      expect(networks).not.toContain(BlockchainNetwork.MOONBEAM_TESTNET);
      expect(networks).not.toContain(BlockchainNetwork.BASE);
      expect(networks).toHaveLength(4);
    });
  });
});
