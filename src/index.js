import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { mainnet, polygon, polygonAmoy, bsc } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { infuraProvider } from 'wagmi/providers/infura';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initReownAppKit } from './components/ReownConnect';
import App from './App';
import './styles.css';

// Настройка провайдеров для цепочек
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, polygon, polygonAmoy, bsc],
  [
    publicProvider(),
    infuraProvider({ apiKey: process.env.REACT_APP_INFURA_API_KEY || '' }),
    alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_API_KEY || '' }),
  ]
);

// Настройка коннекторов
const connectors = [
  new MetaMaskConnector({ chains }),
  new InjectedConnector({ chains }),
  new CoinbaseWalletConnector({
    chains,
    options: {
      appName: 'Meta ART',
    },
  }),
];

// Создаем QueryClient для React Query
const queryClient = new QueryClient();

// Отключаем аналитику и телеметрию
if (typeof window !== 'undefined') {
  window.localStorage.setItem('WALLETCONNECT_DISABLE_ANALYTICS', 'true');
  window.localStorage.setItem('WALLETCONNECT_DISABLE_TELEMETRY', 'true');
}

// Создаем конфигурацию Wagmi
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

// Инициализация Reown AppKit
initReownAppKit();

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
