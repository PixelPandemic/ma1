import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiConfig, createConfig } from 'wagmi';
import { mainnet, polygon, polygonAmoy, bsc } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initReownAppKit } from './components/ReownConnect';
import App from './App';
import './styles.css';

// Создаем простую конфигурацию для Wagmi
const chains = [mainnet, polygon, polygonAmoy, bsc];

// Создаем конфигурацию Wagmi
const wagmiConfig = createConfig({
  autoConnect: true,
  chains,
});

// Создаем QueryClient для React Query
const queryClient = new QueryClient();

// Отключаем аналитику и телеметрию
if (typeof window !== 'undefined') {
  window.localStorage.setItem('WALLETCONNECT_DISABLE_ANALYTICS', 'true');
  window.localStorage.setItem('WALLETCONNECT_DISABLE_TELEMETRY', 'true');
}



// Инициализация Reown AppKit
initReownAppKit(wagmiConfig);

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
