import React from 'react';
import { Box, Text, SimpleGrid, Button, useBreakpointValue } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

// В RainbowKit v2 мы не можем использовать WalletButton напрямую
// Вместо этого мы создадим кастомный интерфейс

const CustomWalletList = () => {
  // Определяем количество колонок в зависимости от размера экрана
  const columns = useBreakpointValue({ base: 3, md: 4 });
  const { isConnected } = useAccount();

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

      {/* Используем стандартный ConnectButton с кастомным отображением */}
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          return (
            <Box>
              {!isConnected && (
                <Box>
                  <Text textAlign="center" mb={4} fontSize="sm">
                    Выберите кошелек для подключения:
                  </Text>

                  <SimpleGrid columns={columns} spacing={3}>
                    {/* MetaMask */}
                    <Button
                      onClick={openConnectModal}
                      size="sm"
                      width="100%"
                      height="auto"
                      py={2}
                      borderRadius="md"
                      colorScheme="purple"
                      _hover={{ transform: 'scale(1.05)' }}
                      transition="all 0.2s"
                    >
                      MetaMask
                    </Button>

                    {/* Rainbow */}
                    <Button
                      onClick={openConnectModal}
                      size="sm"
                      width="100%"
                      height="auto"
                      py={2}
                      borderRadius="md"
                      colorScheme="purple"
                      _hover={{ transform: 'scale(1.05)' }}
                      transition="all 0.2s"
                    >
                      Rainbow
                    </Button>

                    {/* WalletConnect */}
                    <Button
                      onClick={openConnectModal}
                      size="sm"
                      width="100%"
                      height="auto"
                      py={2}
                      borderRadius="md"
                      colorScheme="purple"
                      _hover={{ transform: 'scale(1.05)' }}
                      transition="all 0.2s"
                    >
                      WalletConnect
                    </Button>

                    {/* Coinbase */}
                    <Button
                      onClick={openConnectModal}
                      size="sm"
                      width="100%"
                      height="auto"
                      py={2}
                      borderRadius="md"
                      colorScheme="purple"
                      _hover={{ transform: 'scale(1.05)' }}
                      transition="all 0.2s"
                    >
                      Coinbase
                    </Button>

                    {/* Trust */}
                    <Button
                      onClick={openConnectModal}
                      size="sm"
                      width="100%"
                      height="auto"
                      py={2}
                      borderRadius="md"
                      colorScheme="purple"
                      _hover={{ transform: 'scale(1.05)' }}
                      transition="all 0.2s"
                    >
                      Trust
                    </Button>

                    {/* Binance */}
                    <Button
                      onClick={openConnectModal}
                      size="sm"
                      width="100%"
                      height="auto"
                      py={2}
                      borderRadius="md"
                      colorScheme="purple"
                      _hover={{ transform: 'scale(1.05)' }}
                      transition="all 0.2s"
                    >
                      Binance
                    </Button>
                  </SimpleGrid>
                </Box>
              )}
            </Box>
          );
        }}
      </ConnectButton.Custom>
    </Box>
  );
};

export default CustomWalletList;
