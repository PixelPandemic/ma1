import { useState, useEffect } from 'react';
import {
  Button,
  Text,
  Box,
  HStack,
  VStack,
  Badge,
  useToast,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  Divider
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { FiPower, FiChevronDown } from 'react-icons/fi';

// Поддерживаемые сети
const SUPPORTED_CHAINS = [
  {
    id: 80002,
    name: 'Polygon Amoy',
    chainId: '0x13882',
    nativeCurrency: {
      name: 'POL',
      symbol: 'POL',
      decimals: 18
    },
    rpcUrls: ['https://rpc-amoy.polygon.technology'],
    blockExplorerUrls: ['https://amoy.polygonscan.com/'],
    color: 'purple'
  },
  {
    id: 1,
    name: 'Ethereum',
    chainId: '0x1',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io'],
    color: 'blue'
  },
  {
    id: 137,
    name: 'Polygon',
    chainId: '0x89',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com/'],
    color: 'purple'
  },
  {
    id: 56,
    name: 'Binance Smart Chain',
    chainId: '0x38',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com/'],
    color: 'yellow'
  }
];

const SimpleMultiWalletConnect = ({ setProvider, setAccount }) => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [currentChain, setCurrentChain] = useState(null);
  const toast = useToast();

  // Проверяем подключение при загрузке
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            initializeConnection();
          }
        });

      // Слушаем изменения сети
      window.ethereum.on('chainChanged', () => {
        checkNetwork();
      });

      // Слушаем изменения аккаунта
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          // Пользователь отключился
          disconnectWallet();
        } else {
          setAddress(accounts[0]);
          setAccount(accounts[0]);
        }
      });
    }
  }, []);

  // Проверяем текущую сеть
  const checkNetwork = async () => {
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const chainIdDecimal = parseInt(chainId, 16);

        const chain = SUPPORTED_CHAINS.find(c => c.id === chainIdDecimal);
        setCurrentChain(chain || { id: chainIdDecimal, name: `Unknown Network (${chainIdDecimal})`, color: 'gray' });

        // Если сеть не поддерживается, показываем предупреждение в виде toast
        if (!chain) {
          console.warn(`Connected to unsupported network with chainId: ${chainIdDecimal}`);

          // Показываем уведомление вместо ошибки
          toast({
            title: 'Network Information',
            description: `All transactions will use this network's native currency. Make sure you have enough funds.`,
            status: 'info',
            duration: 7000,
            isClosable: true,
            position: 'top',
            containerStyle: {
              zIndex: 9999
            }
          });
        } else if (chain.id !== 80002) {
          // Если сеть поддерживается, но это не Polygon Amoy, показываем предупреждение
          toast({
            title: 'Network Information',
            description: `All transactions will use ${chain.nativeCurrency.symbol} as the native currency. Make sure you have enough funds.`,
            status: 'info',
            duration: 7000,
            isClosable: true,
            position: 'top',
            containerStyle: {
              zIndex: 9999
            }
          });
        }

        return chain;
      } catch (error) {
        console.error("Error checking network:", error);
        setCurrentChain({ id: 0, name: 'Network Error', color: 'red' });
        return null;
      }
    }
    return null;
  };

  // Переключаем сеть
  const switchNetwork = async (chainId) => {
    try {
      if (!window.ethereum) {
        toast({
          title: 'No Ethereum Wallet',
          description: 'Please install MetaMask or another Ethereum wallet',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return false;
      }

      const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
      if (!chain) return false;

      try {
        // Пытаемся переключиться на сеть
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chain.chainId }],
        });

        // Обновляем текущую сеть
        setCurrentChain(chain);
        return true;
      } catch (error) {
        // Если сеть не добавлена, добавляем ее
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: chain.chainId,
                  chainName: chain.name,
                  nativeCurrency: chain.nativeCurrency,
                  rpcUrls: chain.rpcUrls,
                  blockExplorerUrls: chain.blockExplorerUrls,
                },
              ],
            });

            // Обновляем текущую сеть
            setCurrentChain(chain);
            return true;
          } catch (addError) {
            console.error('Error adding chain:', addError);
            toast({
              title: 'Network Error',
              description: `Failed to add ${chain.name} network: ${addError.message}`,
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
            return false;
          }
        }

        console.error('Error switching chain:', error);
        toast({
          title: 'Network Error',
          description: `Failed to switch to ${chain.name}: ${error.message}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return false;
      }
    } catch (error) {
      console.error('Error in switchNetwork:', error);
      return false;
    }
  };

  // Инициализируем подключение
  const initializeConnection = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });

        // Проверяем текущую сеть
        const chain = await checkNetwork();

        // Устанавливаем провайдер и аккаунт
        setProvider(provider);
        setAccount(accounts[0]);
        setAddress(accounts[0]);
        setConnected(true);

        return true;
      } catch (error) {
        console.error("Error connecting wallet:", error);
        toast({
          title: 'Connection Error',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return false;
      }
    } else {
      toast({
        title: 'Wallet Not Found',
        description: 'Please install MetaMask or another Ethereum wallet',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };

  // Подключаем кошелек
  const connectWallet = async () => {
    const success = await initializeConnection();
    if (success) {
      toast({
        title: 'Wallet Connected',
        description: 'Your wallet has been connected successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Отключаем кошелек
  const disconnectWallet = () => {
    setConnected(false);
    setAddress('');
    setCurrentChain(null);
    setProvider(null);
    setAccount(null);

    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected from the app',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // Обработчик переключения сети
  const handleSwitchNetwork = async (chainId) => {
    const success = await switchNetwork(chainId);
    if (success) {
      const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
      toast({
        title: 'Network Switched',
        description: `Successfully connected to ${chain.name}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
        className: 'network-switched-notification',
        containerStyle: {
          zIndex: 9999
        }
      });
    }
  };

  // Форматирование адреса кошелька
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <Box>
      {!connected ? (
        <Button
          colorScheme="purple"
          onClick={connectWallet}
          size="md"
          className="connect-wallet-btn"
        >
          Connect Wallet
        </Button>
      ) : (
        <HStack spacing={4}>
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              colorScheme={currentChain?.color || 'gray'}
              rightIcon={<FiChevronDown />}
            >
              {currentChain?.name || 'Unknown Network'}
            </MenuButton>
            <MenuList>
              <MenuItem fontWeight="bold" isDisabled>Switch Network</MenuItem>
              <Divider my={1} />
              {SUPPORTED_CHAINS.map((chain) => (
                <MenuItem
                  key={chain.id}
                  onClick={() => handleSwitchNetwork(chain.id)}
                  isDisabled={currentChain?.id === chain.id}
                >
                  <Flex align="center">
                    <Badge
                      colorScheme={chain.color}
                      mr={2}
                      px={2}
                      py={1}
                      borderRadius="md"
                    >
                      {chain.name}
                    </Badge>
                    {currentChain?.id === chain.id && (
                      <Text fontSize="xs" color="green.500" ml={1}>
                        (Current)
                      </Text>
                    )}
                  </Flex>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          <Text fontWeight="medium" color="white">
            {formatAddress(address)}
          </Text>

          <Box
            as="button"
            onClick={disconnectWallet}
            aria-label="Disconnect wallet"
            opacity={0.7}
            transition="all 0.2s"
            _hover={{ opacity: 1 }}
          >
            <Icon
              as={FiPower}
              w={5}
              h={5}
              color="white"
            />
          </Box>
        </HStack>
      )}
    </Box>
  );
};

export default SimpleMultiWalletConnect;
