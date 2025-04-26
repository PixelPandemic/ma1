import { useState, useEffect, useRef } from 'react';
import { Box, useToast } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect, useNetwork } from 'wagmi';
import { ethers } from 'ethers';

const RainbowConnect = ({ setProvider, setAccount }) => {
  const toast = useToast();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { disconnect } = useDisconnect();
  const connectButtonRef = useRef(null);

  // Функция для применения стилей к модальному окну RainbowKit
  const applyRainbowKitStyles = () => {
    console.log('Applying RainbowKit styles from component');

    // Находим все элементы RainbowKit
    const rainbowKitElements = document.querySelectorAll('[data-rk]');

    if (rainbowKitElements.length > 0) {
      // Находим модальное окно с кошельками
      const walletLists = document.querySelectorAll('[data-rk] div[class*="ConnectModal_walletList"]');
      walletLists.forEach(list => {
        list.style.display = 'grid';
        list.style.gridTemplateColumns = window.innerWidth <= 576
          ? 'repeat(3, 1fr)'
          : 'repeat(auto-fill, minmax(100px, 1fr))';
        list.style.gap = window.innerWidth <= 576 ? '8px' : '12px';
        list.style.width = '100%';
      });

      // Находим элементы кошельков
      const walletItems = document.querySelectorAll('[data-rk] div[class*="ConnectModal_wallet"]');
      walletItems.forEach(item => {
        item.style.width = '100%';
        item.style.minWidth = '0';

        if (window.innerWidth <= 576) {
          item.style.padding = '8px';

          // Находим изображения кошельков
          const images = item.querySelectorAll('img');
          images.forEach(img => {
            img.style.width = '28px';
            img.style.height = '28px';
          });

          // Находим названия кошельков
          const texts = item.querySelectorAll('div');
          texts.forEach(text => {
            text.style.fontSize = '12px';
            text.style.whiteSpace = 'nowrap';
            text.style.overflow = 'hidden';
            text.style.textOverflow = 'ellipsis';
          });
        }
      });
    }
  };

  // Эффект для обновления провайдера и аккаунта при подключении
  useEffect(() => {
    if (isConnected && address) {
      // Создаем провайдер, если доступен window.ethereum
      if (window.ethereum) {
        try {
          const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(ethersProvider);
          setAccount(address);

          // Показываем уведомление об успешном подключении
          toast({
            title: 'Wallet Connected',
            description: `Connected to ${chain?.name || 'network'} with address ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } catch (error) {
          console.error("Error creating provider:", error);
        }
      }
    } else {
      setProvider(null);
      setAccount(null);
    }
  }, [isConnected, address, chain, setProvider, setAccount, toast]);

  // Добавляем эффект для применения стилей при монтировании компонента
  useEffect(() => {
    // Применяем стили с задержкой
    const timers = [
      setTimeout(applyRainbowKitStyles, 500),
      setTimeout(applyRainbowKitStyles, 1000),
      setTimeout(applyRainbowKitStyles, 2000),
      setTimeout(applyRainbowKitStyles, 3000)
    ];

    // Добавляем наблюдатель за изменениями в DOM
    const observer = new MutationObserver((mutations) => {
      // Проверяем, появились ли новые элементы RainbowKit
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Проверяем, есть ли у элемента или его потомков атрибут data-rk
              if ((node.hasAttribute && node.hasAttribute('data-rk')) ||
                  (node.querySelector && node.querySelector('[data-rk]'))) {
                console.log('New RainbowKit element detected, applying styles');
                applyRainbowKitStyles();
                setTimeout(applyRainbowKitStyles, 100);
                setTimeout(applyRainbowKitStyles, 300);
              }
            }
          }
        }
      }
    });

    // Начинаем наблюдение за изменениями в DOM
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-rk'] });

    // Очищаем таймеры и наблюдатель при размонтировании
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      observer.disconnect();
    };
  }, []);

  // Кастомизация кнопки подключения RainbowKit
  return (
    <Box>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          // Примечание: Если ваш приложение не использует аутентификацию, вы
          // можете удалить все проверки, связанные с authenticationStatus
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated');

          // Функция для открытия модального окна подключения с применением стилей
          const handleOpenConnectModal = () => {
            // Сначала открываем модальное окно
            openConnectModal();

            // Затем применяем стили с задержкой
            setTimeout(applyRainbowKitStyles, 100);
            setTimeout(applyRainbowKitStyles, 300);
            setTimeout(applyRainbowKitStyles, 500);
            setTimeout(applyRainbowKitStyles, 1000);
          };

          return (
            <Box
              ref={connectButtonRef}
              {...(!ready && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <Button onClick={handleOpenConnectModal} colorScheme="purple">
                      Connect Wallet
                    </Button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <Button onClick={openChainModal} colorScheme="red">
                      Wrong network
                    </Button>
                  );
                }

                return (
                  <Box display="flex" gap="12px">
                    <Button
                      onClick={openChainModal}
                      style={{ display: 'flex', alignItems: 'center' }}
                      colorScheme={
                        chain.name.includes('Polygon') ? 'purple' :
                        chain.name.includes('Ethereum') ? 'blue' :
                        chain.name.includes('Binance') ? 'yellow' : 'gray'
                      }
                      rightIcon={<ChevronDownIcon />}
                    >
                      {chain.hasIcon && (
                        <Box
                          style={{
                            background: chain.iconBackground,
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            overflow: 'hidden',
                            marginRight: 4,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 12, height: 12 }}
                            />
                          )}
                        </Box>
                      )}
                      {chain.name.includes('Polygon') ? `${chain.name} (POL)` : chain.name}
                    </Button>

                    <Button onClick={openAccountModal}>
                      {account.displayName}
                      {account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ''}
                    </Button>
                  </Box>
                );
              })()}
            </Box>
          );
        }}
      </ConnectButton.Custom>
    </Box>
  );
};

// Компоненты для кастомизации кнопки
const Button = ({ children, ...props }) => {
  return (
    <Box
      as="button"
      bg="purple.500"
      color="white"
      py="2"
      px="4"
      borderRadius="md"
      fontWeight="semibold"
      _hover={{ bg: 'purple.600' }}
      transition="all 0.2s"
      {...props}
    >
      {children}
    </Box>
  );
};

const ChevronDownIcon = () => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default RainbowConnect;
