import React from 'react';
import ReactDOM from 'react-dom/client';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  polygonAmoy,
  bsc,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import App from './App';
import './styles.css';
// Настраиваем конфигурацию для RainbowKit и Wagmi
const config = getDefaultConfig({
  appName: 'Meta ART',
  projectId: '386d6f1cb5083b6db1f57fe136dde79e',
  chains: [mainnet, polygon, polygonAmoy, bsc],
  ssr: false, // Отключаем SSR, так как наше приложение не использует серверный рендеринг
});

// Создаем QueryClient для React Query
const queryClient = new QueryClient();



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
