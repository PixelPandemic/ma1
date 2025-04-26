import React from 'react';
import ReactDOM from 'react-dom/client';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import {
  trustWallet,
  ledgerWallet,
  coinbaseWallet,
  braveWallet,
  safeWallet,
  walletConnectWallet,
  bybitWallet,
  phantomWallet,
  binanceWallet,
  bitgetWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, http } from 'wagmi';
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
// Определяем URL и иконку для метаданных
const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://masnp.netlify.app';
const iconUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo192.png` : 'https://masnp.netlify.app/logo192.png';

// Определяем список цепей
const chains = [mainnet, polygon, polygonAmoy, bsc];

// Создаем конфигурацию с правильными метаданными и дополнительными кошельками
const config = getDefaultConfig({
  appName: 'Meta ART',
  projectId: '386d6f1cb5083b6db1f57fe136dde79e',
  chains,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
    [bsc.id]: http(),
  },
  ssr: false, // Отключаем SSR, так как наше приложение не использует серверный рендеринг
  // Настройки WalletConnect
  walletConnectProjectId: '386d6f1cb5083b6db1f57fe136dde79e',
  metadata: {
    name: 'Meta ART',
    description: 'NFT Marketplace with Staking Rewards',
    url: siteUrl,
    icons: [iconUrl]
  },
  // Добавляем дополнительные кошельки
  wallets: [
    {
      groupName: 'Популярные',
      wallets: [
        trustWallet,
        ledgerWallet,
        coinbaseWallet,
        braveWallet,
        safeWallet,
        walletConnectWallet,
        bybitWallet,
        phantomWallet,
        binanceWallet,
        bitgetWallet,
      ]
    }
  ]
});

// Создаем QueryClient для React Query
const queryClient = new QueryClient();



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          locale="ru-RU"
          theme={darkTheme({
            accentColor: '#805AD5', // purple.500 - фиолетовый акцент для соответствия дизайну
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          modalSize="compact" // Компактный размер для лучшего отображения на мобильных устройствах
          showRecentTransactions={true} // Включаем отображение недавних транзакций
          coolMode // Включаем крутой режим с анимацией конфетти при выборе кошелька
        >
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
