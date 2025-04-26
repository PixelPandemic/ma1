import React from 'react';
import { Box, Text, Heading } from '@chakra-ui/react';
import { createConnector } from '@rainbow-me/rainbowkit';

// Создаем кастомный коннектор для RainbowKit
export const customConnector = createConnector({
  id: 'custom-connector',
  name: 'Custom Connector',
  iconUrl: 'https://masnp.netlify.app/logo192.png',
  iconBackground: '#805AD5',
  
  // Функция для создания коннектора
  createConnector: () => {
    return {
      // Возвращаем объект с методами для взаимодействия с кошельком
      getProvider: () => null,
      connect: async () => null,
      disconnect: async () => null,
      isConnected: false,
      // Кастомный компонент для отображения в модальном окне
      instructions: {
        // Компонент для мобильных устройств
        mobile: CustomMobileInstructions,
        // Компонент для десктопов
        desktop: CustomDesktopInstructions,
      },
    };
  },
});

// Кастомный компонент для мобильных устройств
function CustomMobileInstructions() {
  return (
    <Box p={4} textAlign="center">
      <Heading size="md" mb={4} color="purple.500">Welcome to Meta ART!</Heading>
      <Text fontSize="sm">
        Connect your wallet to start using the NFT marketplace.
      </Text>
    </Box>
  );
}

// Кастомный компонент для десктопов
function CustomDesktopInstructions() {
  return (
    <Box p={4} textAlign="center">
      <Heading size="md" mb={4} color="purple.500">Welcome to Meta ART!</Heading>
      <Text fontSize="sm">
        Connect your wallet to start using the NFT marketplace.
      </Text>
    </Box>
  );
}
