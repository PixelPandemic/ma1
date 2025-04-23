import { useEffect, useState } from 'react';
import { Button, Text, Box, HStack, VStack, Badge, useToast, Icon } from '@chakra-ui/react';
import { ethers } from 'ethers';
// Импортируем иконку Power из библиотеки react-icons
import { FiPower } from 'react-icons/fi';

const WalletConnect = ({ setProvider, setAccount }) => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const toast = useToast();

  const POLYGON_AMOY_CHAIN_ID = '0x13882'; // 80002 in hex

  useEffect(() => {
    // Check if already connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            initializeConnection();
          }
        });

      // Listen for network changes
      window.ethereum.on('chainChanged', () => {
        checkNetwork();
      });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          // User disconnected
          setConnected(false);
          setAddress('');
          setProvider(null);
          setAccount(null);
        } else {
          setAddress(accounts[0]);
          setAccount(accounts[0]);
        }
      });
    }
  }, []);

  const checkNetwork = async () => {
    if (window.ethereum) {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setNetwork(chainId);

      const isAmoy = chainId === POLYGON_AMOY_CHAIN_ID;
      setIsCorrectNetwork(isAmoy);

      console.log('Current Chain ID:', chainId);
      console.log('Expected Chain ID:', POLYGON_AMOY_CHAIN_ID);
      console.log('Is Amoy Network:', isAmoy);

      return isAmoy;
    }
    return false;
  };

  const switchToAmoy = async () => {
    console.log('Attempting to switch to Polygon Amoy...');

    if (!window.ethereum || !isMetaMaskInstalled()) {
      console.error('MetaMask not detected');
      toast({
        title: 'MetaMask Required',
        description: 'Please install MetaMask to use this app. If you have Phantom Wallet, please disable it temporarily.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    try {
      console.log('Requesting chain switch to:', POLYGON_AMOY_CHAIN_ID);
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_AMOY_CHAIN_ID }],
      });
      console.log('Successfully switched chain');

      // Check if we need to connect after switching
      if (!connected) {
        setTimeout(() => {
          connectWallet();
        }, 1000);
      }

      return true;
    } catch (error) {
      console.log('Error switching chain:', error);
      // If the chain hasn't been added to MetaMask
      if (error.code === 4902) {
        try {
          console.log('Chain not added, adding Polygon Amoy...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: POLYGON_AMOY_CHAIN_ID,
                chainName: 'Polygon Amoy Testnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc-amoy.polygon.technology'],
                blockExplorerUrls: ['https://amoy.polygonscan.com/'],
              },
            ],
          });
          console.log('Successfully added Polygon Amoy');

          // Check if we need to connect after adding
          if (!connected) {
            setTimeout(() => {
              connectWallet();
            }, 1000);
          }

          return true;
        } catch (addError) {
          console.error('Error adding Polygon Amoy network:', addError);
          toast({
            title: 'Network Error',
            description: 'Failed to add Polygon Amoy network: ' + addError.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return false;
        }
      }
      console.error('Error switching to Polygon Amoy:', error);
      toast({
        title: 'Network Error',
        description: 'Failed to switch to Polygon Amoy: ' + error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };

  // Функция для проверки наличия MetaMask
  const isMetaMaskInstalled = () => {
    const { ethereum } = window;
    return Boolean(ethereum && ethereum.isMetaMask);
  };

  const initializeConnection = async () => {
    if (window.ethereum && isMetaMaskInstalled()) {
      try {
        console.log('Initializing connection...');
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });

        console.log('Connected accounts:', accounts);

        const isAmoy = await checkNetwork();
        console.log('Is Amoy network check result:', isAmoy);

        if (!isAmoy) {
          console.log('Not on Amoy network, showing toast...');
          toast({
            title: 'Wrong Network',
            description: 'Please switch to Polygon Amoy Testnet',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        setProvider(provider);
        setAccount(accounts[0]);
        setAddress(accounts[0]);
        setConnected(true);
        console.log('Connection successful!');
      } catch (error) {
        console.error("Error connecting wallet:", error);
        toast({
          title: 'Connection Error',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } else {
      console.log('MetaMask not detected');
      toast({
        title: 'MetaMask Required',
        description: 'Please install MetaMask to use this app. If you have Phantom Wallet, please disable it temporarily.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const connectWallet = async () => {
    console.log('Connecting wallet...');
    await initializeConnection();
  };

  const handleNetworkSwitch = async () => {
    const success = await switchToAmoy();
    if (success) {
      toast({
        title: 'Network Switched',
        description: 'Successfully connected to Polygon Amoy Testnet',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Функция для явного открытия MetaMask
  const openMetaMask = () => {
    if (isMetaMaskInstalled()) {
      // Просто отправляем запрос на получение аккаунтов, что должно открыть MetaMask
      window.ethereum.request({ method: 'eth_requestAccounts' })
        .catch(err => console.error('Error opening MetaMask:', err));
    } else {
      toast({
        title: 'MetaMask Not Found',
        description: 'Please install MetaMask extension',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Функция для подключения к сайту и кошельку
  const connectToSite = async () => {
    if (isMetaMaskInstalled()) {
      try {
        console.log('Requesting connection to site...');
        // Явно запрашиваем разрешение на подключение к сайту
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });

        // Подключаем кошелек
        await connectWallet();

        // Проверяем и переключаем сеть при необходимости
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== POLYGON_AMOY_CHAIN_ID) {
          await switchToAmoy();
        }
      } catch (error) {
        console.error('Error connecting to site:', error);
        toast({
          title: 'Connection Error',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } else {
      toast({
        title: 'MetaMask Not Found',
        description: 'Please install MetaMask extension',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Функция для отключения кошелька
  const disconnectWallet = () => {
    setConnected(false);
    setAddress('');
    setIsCorrectNetwork(false);
    setProvider(null);
    setAccount(null);
    localStorage.removeItem('walletConnected');
    console.log('Wallet disconnected');
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected from the app',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box>
      {!connected ? (
        <Button
          colorScheme="teal"
          onClick={connectToSite}
          size="md"
          className="connect-metamask-btn"
        >
          Connect MetaMask
        </Button>
      ) : (
        <HStack spacing={4}>
          {!isCorrectNetwork ? (
            <Button size="sm" colorScheme="red" onClick={handleNetworkSwitch}>
              Switch to Polygon Amoy
            </Button>
          ) : (
            <Badge colorScheme="green" p={2} borderRadius="md">
              Polygon Amoy
            </Badge>
          )}
          <Text fontWeight="medium" color="white">
            {address.substring(0, 6)}...{address.substring(address.length - 4)}
          </Text>
          {/* Заменяем кнопку на прозрачную иконку power */}
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

export default WalletConnect;