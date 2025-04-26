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
  zerionWallet,
  exodusWallet,
  phantomWallet,
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
        zerionWallet,
        exodusWallet,
        phantomWallet,
      ],
    },
  ],
});
```

## Список доступных кошельков

- MetaMask (по умолчанию)
- Rainbow Wallet (по умолчанию)
- Coinbase Wallet (по умолчанию)
- WalletConnect (по умолчанию)
- Trust Wallet
- Ledger Live
- Zerion
- Exodus
- Phantom
- Brave Wallet
- Argent
- imToken
- Omni
- Safe (бывший Gnosis Safe)
- Taho (бывший Tally Ho)
- Frontier
- XDEFI
- Frame

## Примечания

- Для большинства кошельков требуется projectId от WalletConnect.
- В RainbowKit 2.x импорты кошельков изменились, теперь они импортируются из `@rainbow-me/rainbowkit/wallets`.
- Для добавления кошельков в RainbowKit 2.x используется параметр `wallets` в конфигурации.
