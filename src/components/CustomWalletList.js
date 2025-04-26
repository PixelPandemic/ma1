import React from 'react';
import { Box, Text, SimpleGrid, Button, useBreakpointValue } from '@chakra-ui/react';
import { WalletButton } from '@rainbow-me/rainbowkit';

// Список кошельков, которые мы хотим отобразить
const wallets = [
  { id: 'metaMask', name: 'MetaMask' },
  { id: 'rainbow', name: 'Rainbow' },
  { id: 'walletConnect', name: 'WalletConnect' },
  { id: 'coinbase', name: 'Coinbase' },
  { id: 'trust', name: 'Trust' },
  { id: 'ledger', name: 'Ledger' },
  { id: 'brave', name: 'Brave' },
  { id: 'binance', name: 'Binance' },
  { id: 'bitget', name: 'Bitget' },
  { id: 'bybit', name: 'Bybit' },
  { id: 'phantom', name: 'Phantom' },
  { id: 'safe', name: 'Safe' }
];

const CustomWalletList = () => {
  // Определяем количество колонок в зависимости от размера экрана
  const columns = useBreakpointValue({ base: 3, md: 4 });
  
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
      
      <SimpleGrid columns={columns} spacing={3}>
        {wallets.map((wallet) => (
          <WalletButton.Custom key={wallet.id} wallet={wallet.id}>
            {({ ready, connect }) => (
              <Button
                onClick={connect}
                disabled={!ready}
                size="sm"
                width="100%"
                height="auto"
                py={2}
                borderRadius="md"
                colorScheme="purple"
                opacity={ready ? 1 : 0.5}
                _hover={{ transform: 'scale(1.05)' }}
                transition="all 0.2s"
              >
                {wallet.name}
              </Button>
            )}
          </WalletButton.Custom>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default CustomWalletList;
