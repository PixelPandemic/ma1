import React from 'react';
import { Box, Text, SimpleGrid, Button, useBreakpointValue, Image, Flex } from '@chakra-ui/react';
import { useAccount, useConnect } from 'wagmi';
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  trustWallet,
  binanceWallet,
  braveWallet,
  bybitWallet,
  phantomWallet,
  rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets';

// Иконки кошельков
const walletIcons = {
  MetaMask: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
  Coinbase: 'https://static.coingecko.com/s/coinbase-wallet-f380b765cf7c762453f27ce0379d308d7909a7a0b89e76521f8cbd9427456270.png',
  WalletConnect: 'https://1000logos.net/wp-content/uploads/2022/05/WalletConnect-Logo.png',
  Trust: 'https://trustwallet.com/assets/images/media/assets/trust_platform.svg',
  Binance: 'https://public.bnbstatic.com/static/images/common/favicon.ico',
  Brave: 'https://brave.com/static-assets/images/brave-logo-no-shadow.svg',
  Bybit: 'https://www.bybit.com/favicon.ico',
  Phantom: 'https://phantom.app/favicon.ico',
  Rainbow: 'https://rainbow.me/favicon.ico'
};

const CustomWalletList = ({ onClose }) => {
  // Определяем количество колонок в зависимости от размера экрана
  const columns = useBreakpointValue({ base: 3, md: 4 });
  const { isConnected } = useAccount();
  const { connect } = useConnect();

  // Функция для подключения конкретного кошелька
  const connectWallet = (wallet) => {
    // Общие параметры для всех кошельков
    const projectId = '386d6f1cb5083b6db1f57fe136dde79e';

    // Открываем стандартное модальное окно RainbowKit
    // В RainbowKit v2 нет прямого способа подключить конкретный кошелек
    // Поэтому мы просто закрываем наше модальное окно и открываем стандартное
    if (onClose) onClose();

    // Используем setTimeout, чтобы дать время закрыться нашему модальному окну
    setTimeout(() => {
      // Используем глобальную функцию для открытия стандартного модального окна RainbowKit
      if (window.openRainbowKitConnectModal) {
        window.openRainbowKitConnectModal();
      }
    }, 100);
  };

  // Список кошельков для отображения
  const wallets = [
    'MetaMask',
    'Coinbase',
    'WalletConnect',
    'Trust',
    'Binance',
    'Brave',
    'Bybit',
    'Phantom',
    'Rainbow'
  ];

  return (
    <Box p={4}>
      <Text
        textAlign="center"
        fontWeight="bold"
        fontSize="xl"
        color="purple.500"
        mb={4}
      >
        Welcome to Meta ART!
      </Text>

      {!isConnected && (
        <Box>
          <Text textAlign="center" mb={4} fontSize="sm">
            Выберите кошелек для подключения:
          </Text>

          <SimpleGrid columns={columns} spacing={3}>
            {wallets.map((wallet) => (
              <Button
                key={wallet}
                onClick={() => connectWallet(wallet)}
                size="sm"
                width="100%"
                height="auto"
                py={2}
                borderRadius="md"
                colorScheme="purple"
                _hover={{ transform: 'scale(1.05)' }}
                transition="all 0.2s"
              >
                <Flex direction="column" align="center" justify="center">
                  {walletIcons[wallet] && (
                    <Image
                      src={walletIcons[wallet]}
                      alt={`${wallet} icon`}
                      boxSize="20px"
                      mb={1}
                      objectFit="contain"
                    />
                  )}
                  <Text fontSize="xs">{wallet}</Text>
                </Flex>
              </Button>
            ))}
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
};

export default CustomWalletList;
