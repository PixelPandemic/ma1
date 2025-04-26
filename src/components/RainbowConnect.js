import { useState, useEffect } from 'react';
import { Box, useToast } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect, useNetwork } from 'wagmi';
import { ethers } from 'ethers';

const RainbowConnect = ({ setProvider, setAccount }) => {
  const toast = useToast();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { disconnect } = useDisconnect();

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

          return (
            <Box
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
                    <Button onClick={openConnectModal} colorScheme="purple">
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
