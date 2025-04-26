import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { polygonAmoy, mainnet, polygon, bsc, arbitrum } from 'wagmi/chains';

// 1. Define constants
export const projectId = 'c4f79cc821d1db9fa5275b93dd65aef2'; // Тестовый ID проекта WalletConnect

// 2. Create wagmiConfig
const metadata = {
  name: 'Meta ART NFT Marketplace',
  description: 'NFT Marketplace with Staking and Rewards',
  url: 'https://masnp.netlify.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Поддерживаемые сети
export const chains = [
  polygonAmoy, // Polygon Amoy Testnet (основная сеть)
  polygon,     // Polygon Mainnet
  mainnet,     // Ethereum Mainnet
  bsc,         // Binance Smart Chain
  arbitrum     // Arbitrum
];

// Создаем конфигурацию wagmi
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true, // включаем WalletConnect
  enableInjected: true,      // включаем поддержку инжектированных кошельков (MetaMask и др.)
  enableEIP6963: true,       // включаем поддержку EIP-6963 для лучшей интеграции кошельков
  enableCoinbase: true,      // включаем поддержку Coinbase Wallet
});

// 3. Создаем Web3Modal
export const web3Modal = createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#7928CA', // Фиолетовый цвет для соответствия дизайну Meta ART
    '--w3m-border-radius-master': '4px',
  },
  enableAnalytics: false, // Отключаем аналитику
  defaultChain: polygonAmoy, // По умолчанию используем Polygon Amoy
});

// 4. Экспортируем функции для работы с сетями
export const getChainName = (chainId) => {
  const chainMap = {
    80002: 'Polygon Amoy',
    1: 'Ethereum',
    137: 'Polygon',
    56: 'Binance Smart Chain',
    42161: 'Arbitrum'
  };

  return chainMap[chainId] || 'Unknown Network';
};

export const getChainCurrency = (chainId) => {
  const currencyMap = {
    80002: 'POL',
    1: 'ETH',
    137: 'MATIC',
    56: 'BNB',
    42161: 'ETH'
  };

  return currencyMap[chainId] || 'ETH';
};

// 5. Функция для переключения сети
export const switchNetwork = async (chainId) => {
  try {
    if (window.ethereum) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    }
    return false;
  } catch (error) {
    // Если сеть не добавлена, добавляем ее
    if (error.code === 4902) {
      try {
        const chainData = getChainData(chainId);
        if (chainData) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [chainData],
          });
          return true;
        }
      } catch (addError) {
        console.error('Error adding chain:', addError);
      }
    }
    console.error('Error switching chain:', error);
    return false;
  }
};

// 6. Данные для добавления сетей
const getChainData = (chainId) => {
  const chainData = {
    // Polygon Amoy Testnet
    80002: {
      chainId: '0x13882',
      chainName: 'Polygon Amoy Testnet',
      nativeCurrency: {
        name: 'POL',
        symbol: 'POL',
        decimals: 18,
      },
      rpcUrls: ['https://rpc-amoy.polygon.technology'],
      blockExplorerUrls: ['https://amoy.polygonscan.com/'],
    },
    // Polygon Mainnet
    137: {
      chainId: '0x89',
      chainName: 'Polygon Mainnet',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18,
      },
      rpcUrls: ['https://polygon-rpc.com'],
      blockExplorerUrls: ['https://polygonscan.com/'],
    },
    // Binance Smart Chain
    56: {
      chainId: '0x38',
      chainName: 'Binance Smart Chain',
      nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18,
      },
      rpcUrls: ['https://bsc-dataseed.binance.org'],
      blockExplorerUrls: ['https://bscscan.com/'],
    },
    // Arbitrum
    42161: {
      chainId: '0xA4B1',
      chainName: 'Arbitrum One',
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://arb1.arbitrum.io/rpc'],
      blockExplorerUrls: ['https://arbiscan.io/'],
    },
  };

  return chainData[chainId];
};
