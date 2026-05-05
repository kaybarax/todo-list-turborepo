import { BlockchainNetwork } from '../types';
import {
  getNetworkDisplayInfo,
  getMainnetNetworkDisplayInfo,
  getTestnetNetworkDisplayInfo,
  getEVMNetworkDisplayInfo,
  getNetworkColor,
  getSupportedWalletNetworks,
  mapWalletNetworkToBlockchainNetwork,
  mapBlockchainNetworkToWalletNetwork,
  getWalletConnectionUrls,
  generateMockAddress,
} from '../networkConfig';

describe('networkConfig', () => {
  describe('getNetworkDisplayInfo', () => {
    it('should return info for valid network', () => {
      const info = getNetworkDisplayInfo(BlockchainNetwork.POLYGON);
      expect(info.displayName).toBe('Polygon');
      expect(info.isEVM).toBe(true);
    });

    it('should throw error for invalid network', () => {
      expect(() => getNetworkDisplayInfo('invalid' as any)).toThrow('Network display info not found for invalid');
    });
  });

  describe('getMainnetNetworkDisplayInfo', () => {
    it('should only return mainnet networks', () => {
      const networks = getMainnetNetworkDisplayInfo();
      networks.forEach(n => expect(n.isTestnet).toBe(false));
      expect(networks.length).toBeGreaterThan(0);
    });
  });

  describe('getTestnetNetworkDisplayInfo', () => {
    it('should only return testnet networks', () => {
      const networks = getTestnetNetworkDisplayInfo();
      networks.forEach(n => expect(n.isTestnet).toBe(true));
      expect(networks.length).toBeGreaterThan(0);
    });
  });

  describe('getEVMNetworkDisplayInfo', () => {
    it('should only return EVM networks', () => {
      const networks = getEVMNetworkDisplayInfo();
      networks.forEach(n => expect(n.isEVM).toBe(true));
    });
  });

  describe('getNetworkColor', () => {
    it('should return correct color for enum', () => {
      expect(getNetworkColor(BlockchainNetwork.POLYGON)).toBe('#6366f1');
    });

    it('should return correct color for legacy string', () => {
      expect(getNetworkColor('polygon')).toBe('#6366f1');
    });

    it('should return default color for unknown string', () => {
      expect(getNetworkColor('unknown')).toBe('#6b7280');
    });

    it('should return default color for unknown enum', () => {
      expect(getNetworkColor('UNKNOWN_NETWORK' as any)).toBe('#6b7280');
    });

    it('should return default color for legacy string that maps to nothing', () => {
      expect(getNetworkColor('not-in-mapping')).toBe('#6b7280');
    });
  });

  describe('getSupportedWalletNetworks', () => {
    it('should return list of supported networks', () => {
      const networks = getSupportedWalletNetworks();
      expect(networks).toContain('polygon');
      expect(networks).toContain('solana');
    });
  });

  describe('mapBlockchainNetworkToWalletNetwork', () => {
    it('should map correctly', () => {
      expect(mapBlockchainNetworkToWalletNetwork(BlockchainNetwork.POLYGON)).toBe('polygon');
      expect(mapBlockchainNetworkToWalletNetwork(BlockchainNetwork.SOLANA)).toBe('solana');
      expect(mapBlockchainNetworkToWalletNetwork(BlockchainNetwork.POLKADOT)).toBe('polkadot');
      expect(mapBlockchainNetworkToWalletNetwork(BlockchainNetwork.MOONBEAM)).toBe('moonbeam');
      expect(mapBlockchainNetworkToWalletNetwork(BlockchainNetwork.BASE)).toBe('base');
    });

    it('should return undefined for unknown', () => {
      expect(mapBlockchainNetworkToWalletNetwork('unknown' as any)).toBeUndefined();
    });
  });

  describe('mapWalletNetworkToBlockchainNetwork', () => {
    it('should map correctly', () => {
      expect(mapWalletNetworkToBlockchainNetwork('polygon')).toBe(BlockchainNetwork.POLYGON);
      expect(mapWalletNetworkToBlockchainNetwork('solana')).toBe(BlockchainNetwork.SOLANA);
      expect(mapWalletNetworkToBlockchainNetwork('polkadot')).toBe(BlockchainNetwork.POLKADOT);
      expect(mapWalletNetworkToBlockchainNetwork('moonbeam')).toBe(BlockchainNetwork.MOONBEAM);
      expect(mapWalletNetworkToBlockchainNetwork('base')).toBe(BlockchainNetwork.BASE);
    });

    it('should return undefined for unknown', () => {
      expect(mapWalletNetworkToBlockchainNetwork('unknown' as any)).toBeUndefined();
    });
  });

  describe('getWalletConnectionUrls', () => {
    it('should return urls', () => {
      const urls = getWalletConnectionUrls();
      expect(urls.polygon).toBeDefined();
    });
  });

  describe('generateMockAddress', () => {
    it('should generate address with correct prefix', () => {
      expect(generateMockAddress(BlockchainNetwork.POLYGON)).toMatch(/^0x/);
      expect(generateMockAddress(BlockchainNetwork.SOLANA)).toMatch(/^1A1z/);
      expect(generateMockAddress(BlockchainNetwork.POLKADOT)).toMatch(/^5G/);
      expect(generateMockAddress(BlockchainNetwork.MOONBEAM)).toMatch(/^0x/);
      expect(generateMockAddress(BlockchainNetwork.BASE)).toMatch(/^0x/);
      expect(generateMockAddress('unknown' as any)).toMatch(/^0x/);
    });
  });

  describe('display info methods', () => {
    it('should throw for unknown network in getNetworkDisplayInfo', () => {
      expect(() => getNetworkDisplayInfo('UNKNOWN' as any)).toThrow();
    });

    it('should filter mainnet networks', () => {
      const mainnets = getMainnetNetworkDisplayInfo();
      expect(mainnets.every(n => !n.isTestnet)).toBe(true);
    });
  });
});
