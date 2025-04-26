import { useState, useEffect } from 'react';
import { Box, Text, Badge, HStack, Tooltip, Icon } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';

const SimpleNetworkInfo = () => {
  const [currentChain, setCurrentChain] = useState(null);

  useEffect(() => {
    // Проверяем текущую сеть при загрузке
    checkNetwork();

    // Слушаем изменения сети
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        checkNetwork();
      });
    }

    return () => {
      // Очищаем слушатель при размонтировании
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', checkNetwork);
      }
    };
  }, []);

  // Проверяем текущую сеть
  const checkNetwork = async () => {
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const chainIdDecimal = parseInt(chainId, 16);

        // Определяем информацию о сети
        const networkInfo = getNetworkInfo(chainIdDecimal);
        setCurrentChain(networkInfo);
      } catch (error) {
        console.error('Error checking network:', error);
        setCurrentChain(null);
      }
    }
  };

  // Получаем информацию о сети по chainId
  const getNetworkInfo = (chainId) => {
    const networks = {
      1: { name: 'Ethereum', currency: 'ETH', color: 'blue' },
      5: { name: 'Goerli Testnet', currency: 'ETH', color: 'blue' },
      11155111: { name: 'Sepolia Testnet', currency: 'ETH', color: 'blue' },
      137: { name: 'Polygon', currency: 'MATIC', color: 'purple' },
      80001: { name: 'Polygon Mumbai', currency: 'MATIC', color: 'purple' },
      80002: { name: 'Polygon Amoy', currency: 'POL', color: 'purple' },
      56: { name: 'Binance Smart Chain', currency: 'BNB', color: 'yellow' },
      97: { name: 'BSC Testnet', currency: 'BNB', color: 'yellow' },
      42161: { name: 'Arbitrum One', currency: 'ETH', color: 'blue' },
      421613: { name: 'Arbitrum Goerli', currency: 'ETH', color: 'blue' }
    };

    return networks[chainId] || { name: `Unknown Network (${chainId})`, currency: '???', color: 'gray' };
  };

  // Если сеть не определена, возвращаем пустой компонент
  if (!currentChain) return null;

  return (
    <Box
      bg="rgba(0, 0, 0, 0.6)"
      backdropFilter="blur(10px)"
      p={3}
      borderRadius="md"
      boxShadow="md"
      mb={4}
      position="relative"
      zIndex="9990"
    >
      <HStack spacing={3}>
        <Badge
          colorScheme={currentChain.color}
          p={2}
          borderRadius="md"
          fontSize="sm"
        >
          {currentChain.name}
        </Badge>

        <Text color="white" fontSize="sm">
          Native Currency: <Badge colorScheme="green" ml={1}>{currentChain.currency}</Badge>
        </Text>

        <Tooltip
          label="All transactions will use this network's native currency. Make sure you have enough funds."
          placement="top"
        >
          <Icon as={FiInfo} color="gray.400" />
        </Tooltip>
      </HStack>
    </Box>
  );
};

export default SimpleNetworkInfo;
