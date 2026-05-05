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
      mainnet: { rpcUrl: 'http://polygon' },
      mumbai: { rpcUrl: 'http://mumbai' },
    },
    solana: {
      mainnet: { rpcUrl: 'http://solana' },
      devnet: { rpcUrl: 'http://devnet' },
    },
    polkadot: {
      mainnet: { wsEndpoint: 'ws://polkadot' },
      testnet: { wsEndpoint: 'ws://testnet' },
    },
    moonbeam: {
      mainnet: { rpcUrl: 'http://moonbeam' },
      testnet: { rpcUrl: 'http://moonbeam-testnet' },
    },
    base: {
      mainnet: { rpcUrl: 'http://base' },
      testnet: { rpcUrl: 'http://base-testnet' },
    },
  };

  let factory: BlockchainServiceFactory;

  beforeEach(() => {
    factory = new BlockchainServiceFactory(mockConfig);
  });

  describe('getService', () => {
    it('should create and cache Polygon service', () => {
      const service1 = factory.getService(BlockchainNetwork.POLYGON);
      const service2 = factory.getService(BlockchainNetwork.POLYGON);
      expect(service1).toBeInstanceOf(PolygonBlockchainService);
      expect(service1).toBe(service2);
    });

    it('should create Polygon Mumbai service', () => {
      const service = factory.getService(BlockchainNetwork.POLYGON_MUMBAI);
      expect(service).toBeInstanceOf(PolygonBlockchainService);
    });

    it('should create Solana services', () => {
      expect(factory.getService(BlockchainNetwork.SOLANA)).toBeInstanceOf(SolanaBlockchainService);
      expect(factory.getService(BlockchainNetwork.SOLANA_DEVNET)).toBeInstanceOf(SolanaBlockchainService);
    });

    it('should create Polkadot services', () => {
      expect(factory.getService(BlockchainNetwork.POLKADOT)).toBeInstanceOf(PolkadotBlockchainService);
      expect(factory.getService(BlockchainNetwork.POLKADOT_TESTNET)).toBeInstanceOf(PolkadotBlockchainService);
    });

    it('should create Moonbeam services', () => {
      expect(factory.getService(BlockchainNetwork.MOONBEAM)).toBeInstanceOf(MoonbeamBlockchainService);
      expect(factory.getService(BlockchainNetwork.MOONBEAM_TESTNET)).toBeInstanceOf(MoonbeamBlockchainService);
    });

    it('should create Base services', () => {
      expect(factory.getService(BlockchainNetwork.BASE)).toBeInstanceOf(BaseNetworkBlockchainService);
      expect(factory.getService(BlockchainNetwork.BASE_TESTNET)).toBeInstanceOf(BaseNetworkBlockchainService);
    });

    it('should throw error for unsupported network', () => {
      expect(() => factory.getService('UNSUPPORTED' as any)).toThrow();
    });

    it('should throw error if Polygon config is missing', () => {
      const f = new BlockchainServiceFactory({});
      expect(() => f.getService(BlockchainNetwork.POLYGON)).toThrow();
    });

    it('should throw error if Moonbeam config is missing', () => {
      const f = new BlockchainServiceFactory({});
      expect(() => f.getService(BlockchainNetwork.MOONBEAM)).toThrow();
      expect(() => f.getService(BlockchainNetwork.MOONBEAM_TESTNET)).toThrow();
    });

    it('should throw error if Base config is missing', () => {
      const f = new BlockchainServiceFactory({});
      expect(() => f.getService(BlockchainNetwork.BASE)).toThrow();
      expect(() => f.getService(BlockchainNetwork.BASE_TESTNET)).toThrow();
    });
  });

  describe('getAllServices', () => {
    it('should return all configured services', () => {
      const services = factory.getAllServices();
      expect(services.length).toBe(10);
    });

    it('should return empty array if nothing configured', () => {
      const f = new BlockchainServiceFactory({});
      expect(f.getAllServices()).toEqual([]);
    });
  });

  describe('getSupportedNetworks', () => {
    it('should return all configured networks', () => {
      const networks = factory.getSupportedNetworks();
      expect(networks).toContain(BlockchainNetwork.POLYGON);
      expect(networks).toContain(BlockchainNetwork.SOLANA);
      expect(networks.length).toBe(10);
    });

    it('should return empty array if nothing configured', () => {
      const f = new BlockchainServiceFactory({});
      expect(f.getSupportedNetworks()).toEqual([]);
    });
  });
});
