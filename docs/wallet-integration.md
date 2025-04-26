# Добавление дополнительных кошельков в Meta ART

В этом документе описано, как добавить дополнительные кошельки в проект Meta ART.

## Для RainbowKit версии 1.x

```javascript
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
  getDefaultWallets,
  connectorsForWallets,
  wallet,
} from '@rainbow-me/rainbowkit';

// Определяем список цепей
const chains = [mainnet, polygon, polygonAmoy, bsc];

// Получаем стандартные кошельки
const { wallets: defaultWallets } = getDefaultWallets({
  appName: 'Meta ART',
  projectId: '386d6f1cb5083b6db1f57fe136dde79e',
  chains
});

// Добавляем дополнительные кошельки
const connectors = connectorsForWallets([
  ...defaultWallets,
  {
    groupName: 'Популярные',
    wallets: [
      wallet.trust({ projectId: '386d6f1cb5083b6db1f57fe136dde79e', chains }),
      wallet.ledger({ projectId: '386d6f1cb5083b6db1f57fe136dde79e', chains }),
      wallet.zerion({ projectId: '386d6f1cb5083b6db1f57fe136dde79e', chains }),
      wallet.exodus({ projectId: '386d6f1cb5083b6db1f57fe136dde79e', chains }),
      wallet.phantom({ chains }),
    ],
  }
]);

// Создаем конфигурацию с правильными метаданными
const config = getDefaultConfig({
  // ... другие настройки ...
  connectors
});
```

## Для RainbowKit версии 2.x

В RainbowKit 2.x API для добавления кошельков изменился. Вот как добавить дополнительные кошельки:

```javascript
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
  // Другие доступные кошельки в RainbowKit v2:
  // injectedWallet,
  // rainbowWallet,
  // walletConnectWallet,
  // metaMaskWallet,
  // argentWallet,
  // omniWallet,
  // rabbyWallet,
  // frameWallet,
  // tahoWallet,
  // tokenPocketWallet,
  // okxWallet,
} from '@rainbow-me/rainbowkit/wallets';

// Определяем список цепей
const chains = [mainnet, polygon, polygonAmoy, bsc];

// Создаем конфигурацию с дополнительными кошельками
const config = getDefaultConfig({
  appName: 'Meta ART',
  projectId: '386d6f1cb5083b6db1f57fe136dde79e',
  chains,
  // ... другие настройки ...
  wallets: [
    // Стандартные кошельки
    {
      groupName: 'Популярные',
      wallets: [
        trustWallet,
        ledgerWallet,
        coinbaseWallet,
        braveWallet,
        safeWallet,
      ],
    },
  ],
});
```

## Список доступных кошельков в RainbowKit v2

- injectedWallet - Автоматически определяет инжектированный кошелек
- metaMaskWallet - MetaMask
- coinbaseWallet - Coinbase Wallet
- walletConnectWallet - WalletConnect
- rainbowWallet - Rainbow Wallet
- trustWallet - Trust Wallet
- ledgerWallet - Ledger Live
- braveWallet - Brave Wallet
- safeWallet - Safe (бывший Gnosis Safe)
- argentWallet - Argent
- omniWallet - Omni
- rabbyWallet - Rabby
- frameWallet - Frame
- tahoWallet - Taho (бывший Tally Ho)
- tokenPocketWallet - TokenPocket
- okxWallet - OKX Wallet

## Примечание о доступности кошельков

Некоторые кошельки, которые были доступны в RainbowKit v1, могут отсутствовать в RainbowKit v2 или иметь другие имена. Например, Exodus и Phantom не доступны напрямую в RainbowKit v2, но пользователи этих кошельков все равно могут подключиться через WalletConnect.

## Примечания

- Для большинства кошельков требуется projectId от WalletConnect.
- В RainbowKit 2.x импорты кошельков изменились, теперь они импортируются из `@rainbow-me/rainbowkit/wallets`.
- Для добавления кошельков в RainbowKit 2.x используется параметр `wallets` в конфигурации.
