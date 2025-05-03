import { useToast as useChakraToast } from '@chakra-ui/react';

// Кастомный хук для toast-уведомлений с правильным позиционированием
export const useCustomToast = () => {
  const chakraToast = useChakraToast();
  
  const toast = (options) => {
    // Объединяем дефолтные настройки с переданными опциями
    return chakraToast({
      position: 'bottom',
      duration: 5000,
      isClosable: true,
      ...options,
      containerStyle: {
        zIndex: 10001,
        bottom: '150px !important', // Очень большой отступ снизу
        ...(options.containerStyle || {})
      }
    });
  };
  
  return toast;
};

export default useCustomToast;
