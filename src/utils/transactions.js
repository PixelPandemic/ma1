import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';

/**
 * Утилита для добавления транзакции в список недавних транзакций RainbowKit
 * @param {Object} options - Опции для добавления транзакции
 * @param {string} options.hash - Хеш транзакции
 * @param {string} options.description - Описание транзакции
 * @param {number} options.confirmations - Количество подтверждений для завершения (по умолчанию 1)
 */
export const useTrackTransaction = () => {
  const addRecentTransaction = useAddRecentTransaction();

  const trackTransaction = (hash, description, confirmations = 1) => {
    if (!hash || !description) {
      console.error('Missing hash or description for transaction tracking');
      return;
    }

    addRecentTransaction({
      hash,
      description,
      confirmations,
    });
  };

  return trackTransaction;
};
