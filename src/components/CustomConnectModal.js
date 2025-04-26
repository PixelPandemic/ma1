import React, { useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
  Box,
  Text
} from '@chakra-ui/react';
import CustomWalletList from './CustomWalletList';

const CustomConnectModal = ({ isOpen, onClose }) => {
  // Используем useEffect для изменения текста в стандартном модальном окне RainbowKit
  useEffect(() => {
    if (isOpen) {
      // Функция для изменения текста в модальном окне
      const updateRainbowKitText = () => {
        // Находим элементы с текстом дисклеймера
        const disclaimers = document.querySelectorAll('[data-rk] div[class*="ConnectModal_disclaimer"]');
        disclaimers.forEach(disclaimer => {
          // Проверяем, был ли уже изменен текст
          if (!disclaimer.classList.contains('modified-disclaimer')) {
            // Очищаем содержимое
            disclaimer.textContent = 'Welcome to Meta ART!';
            // Добавляем класс, чтобы не изменять повторно
            disclaimer.classList.add('modified-disclaimer');
          }
        });
      };
      
      // Вызываем функцию сразу и с задержкой
      updateRainbowKitText();
      const timers = [
        setTimeout(updateRainbowKitText, 100),
        setTimeout(updateRainbowKitText, 300),
        setTimeout(updateRainbowKitText, 500),
        setTimeout(updateRainbowKitText, 1000)
      ];
      
      // Очищаем таймеры при закрытии модального окна
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [isOpen]);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(5px)" />
      <ModalContent bg="gray.800" color="white" borderRadius="xl">
        <ModalHeader textAlign="center" borderBottomWidth="1px" borderColor="gray.700">
          Connect Wallet
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={4}>
          <CustomWalletList />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CustomConnectModal;
