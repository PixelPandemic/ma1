import React from 'react';
import ReactDOM from 'react-dom/client';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import {
  // Импорты кошельков в алфавитном порядке
  binanceWallet,
  bitgetWallet,
  braveWallet,
  bybitWallet,
  coinbaseWallet,
  ledgerWallet,
  metaMaskWallet,
  phantomWallet,
  safeWallet,
  trustWallet,
  walletConnectWallet,
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
import './styles/toast-fix.css'; // Импортируем стили для исправления toast-уведомлений
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
  // Добавляем дополнительные кошельки, разделенные на группы для лучшего отображения на мобильных устройствах
  wallets: [
    {
      groupName: 'Основные',
      wallets: [
        metaMaskWallet,
        binanceWallet,
        bitgetWallet,
        bybitWallet,
        coinbaseWallet,
        ledgerWallet,
      ]
    },
    {
      groupName: 'Дополнительные',
      wallets: [
        braveWallet,
        phantomWallet,
        safeWallet,
        trustWallet,
        walletConnectWallet,
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
          appInfo={{
            appName: 'Meta ART',
            learnMoreUrl: 'https://masnp.netlify.app'
          }}
        >
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
