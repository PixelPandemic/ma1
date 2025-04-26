import { Box, Text, Badge, HStack, Tooltip, Icon } from '@chakra-ui/react';
import { useNetwork } from '@wagmi/core';
import { FiInfo } from 'react-icons/fi';
import { getChainName, getChainCurrency } from '../utils/web3Config';

const NetworkInfo = () => {
  const { chain } = useNetwork();

  // Если сеть не определена, возвращаем пустой компонент
  if (!chain) return null;

  // Получаем название сети и валюту
  const networkName = getChainName(chain.id);
  const currency = getChainCurrency(chain.id);

  // Определяем цвет бейджа в зависимости от сети
  const getChainColor = (chainId) => {
    const colorMap = {
      80002: 'purple', // Polygon Amoy
      1: 'blue',       // Ethereum
      137: 'purple',   // Polygon
      56: 'yellow',    // BSC
      42161: 'blue'    // Arbitrum
    };

    return colorMap[chainId] || 'gray';
  };

  return (
    <Box
      bg="rgba(0, 0, 0, 0.6)"
      backdropFilter="blur(10px)"
      p={3}
      borderRadius="md"
      boxShadow="md"
      mb={4}
    >
      <HStack spacing={3}>
        <Badge
          colorScheme={getChainColor(chain.id)}
          p={2}
          borderRadius="md"
          fontSize="sm"
        >
          {networkName}
        </Badge>

        <Text color="white" fontSize="sm">
          Native Currency: <Badge colorScheme="green" ml={1}>{currency}</Badge>
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

export default NetworkInfo;
