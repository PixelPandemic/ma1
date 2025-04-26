import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { mainnet, polygon, polygonAmoy, bsc } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { infuraProvider } from 'wagmi/providers/infura';
import { getDefaultWallets, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles.css';
import '@rainbow-me/rainbowkit/styles.css';
// Настраиваем цепочки и провайдеры
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, polygon, polygonAmoy, bsc],
  [
    publicProvider(),
    infuraProvider({ apiKey: process.env.REACT_APP_INFURA_API_KEY || '' }),
    alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_API_KEY || '' }),
  ]
);

// Настраиваем кошельки для RainbowKit
const { connectors } = getDefaultWallets({
  appName: 'Meta ART',
  projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '386d6f1cb5083b6db1f57fe136dde79e',
  chains
});

// Создаем конфигурацию Wagmi
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

// Создаем QueryClient для React Query
const queryClient = new QueryClient();



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          chains={chains}
          theme={darkTheme({
            accentColor: '#805AD5', // purple.500
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          modalSize="compact"
        >
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  </React.StrictMode>
);
