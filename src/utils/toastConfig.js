// Глобальные настройки для toast-уведомлений
export const defaultToastConfig = {
  position: 'bottom', // Позиция внизу
  duration: 5000, // Длительность отображения
  isClosable: true, // Возможность закрыть
  containerStyle: {
    zIndex: 10001, // Очень высокий z-index
  }
};
