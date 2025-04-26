import React from 'react';
import ReactDOM from 'react-dom/client';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { defaultWagmiConfig } from '@web3modal/wagmi/react';
import { mainnet, polygon, polygonAmoy, bsc } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles.css';

// WalletConnect Project ID
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '3ccc0d7a5b5d2c2c9d5f9b9b9b9b9b9b';

// Wagmi config
const metadata = {
  name: 'Meta ART',
  description: 'NFT Marketplace with Staking Rewards',
  url: 'https://masnp.netlify.app',
  icons: ['https://masnp.netlify.app/logo192.png']
};

// Поддерживаемые сети
const chains = [mainnet, polygon, polygonAmoy, bsc];
const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true
});

// Создаем QueryClient для React Query
const queryClient = new QueryClient();

// Отключаем аналитику и телеметрию WalletConnect
if (typeof window !== 'undefined') {
  window.localStorage.setItem('WALLETCONNECT_DISABLE_ANALYTICS', 'true');
  window.localStorage.setItem('WALLETCONNECT_DISABLE_TELEMETRY', 'true');
}

// Инициализация Web3Modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent-color': '#805AD5', // purple.500
    '--w3m-background-color': '#4A1D96', // purple.800
    '--w3m-text-color': '#FFFFFF',
  },
  // Отключаем аналитику, чтобы избежать ошибок CSP
  metadata: {
    ...metadata,
    disableAnalytics: true
  },
  // Отключаем все сетевые запросы для аналитики
  enableAnalytics: false,
  enableNetworkView: false
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiConfig>
  </React.StrictMode>
);
