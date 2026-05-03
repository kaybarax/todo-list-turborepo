// @ts-nocheck
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1281, // Moonbeam development chain ID
    },
    moonbase: {
      url: process.env.MOONBEAM_RPC_URL || 'http://localhost:9933',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1287, // Moonbase Alpha TestNet
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  etherscan: {
    apiKey: {
      moonbaseAlpha: process.env.MOONSCAN_API_KEY || '',
    },
    customChains: [
      {
        network: 'moonbaseAlpha',
        chainId: 1287,
        urls: {
          apiURL: 'https://api-moonbase.moonscan.io/api',
          browserURL: 'https://moonbase.moonscan.io/',
        },
      },
    ],
  },
};

export default config;
