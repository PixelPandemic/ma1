import { useState, useEffect } from 'react';
import { Box, Button, HStack, Text, Icon, Menu, MenuButton, MenuList, MenuItem, Divider, Flex, useToast } from '@chakra-ui/react';
import { FiPower, FiChevronDown } from 'react-icons/fi';
import { createReownAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { useAccount, useDisconnect, useConfig, useChainId } from 'wagmi';
import { ethers } from 'ethers';

// Поддерживаемые сети с цветами для UI
const SUPPORTED_CHAINS = [
  {
    id: 80002, // Polygon Amoy
    color: 'purple',
    hoverColor: 'purple.600'
  },
  {
    id: 1, // Ethereum
    color: 'blue',
    hoverColor: 'cyan.500'
  },
  {
    id: 137, // Polygon
    color: 'purple',
    hoverColor: 'purple.600'
  },
  {
    id: 56, // BSC
    color: 'yellow',
    hoverColor: 'orange.500'
  }
];

// Инициализация Reown AppKit
export const initReownAppKit = () => {
  const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID;
  
  if (!projectId) {
    console.error('Missing REACT_APP_WALLETCONNECT_PROJECT_ID');
    return;
  }
  
  createReownAppKit({
    projectId,
    metadata: {
      name: 'Meta ART',
      description: 'NFT Marketplace with Staking Rewards',
      url: 'https://masnp.netlify.app',
      icons: ['https://masnp.netlify.app/logo192.png']
    },
    adapters: [WagmiAdapter()],
    enableAnalytics: false,
    enableTelemetry: false
  });
};

const ReownConnect = ({ setProvider, setAccount }) => {
  const [currentChain, setCurrentChain] = useState(null);
  const toast = useToast();
  const config = useConfig();
  
  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
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
        } catch (error) {
          console.error("Error creating provider:", error);
        }
      }
      
      // Получаем информацию о текущей сети
      const currentChainInfo = config.chains.find(c => c.id === currentChainId);
      const uiChainInfo = SUPPORTED_CHAINS.find(c => c.id === currentChainId);
      
      if (currentChainInfo) {
        setCurrentChain({
          id: currentChainInfo.id,
          name: currentChainInfo.name,
          color: uiChainInfo?.color || 'gray',
          hoverColor: uiChainInfo?.hoverColor || 'gray.600',
          nativeCurrency: {
            symbol: currentChainInfo.nativeCurrency.symbol
          }
        });
      } else {
        setCurrentChain({ 
          id: currentChainId, 
          name: `Unknown Network (${currentChainId})`, 
          color: 'gray',
          hoverColor: 'gray.600',
          nativeCurrency: { symbol: '???' }
        });
      }
    } else {
      setProvider(null);
      setAccount(null);
      setCurrentChain(null);
    }
  }, [isConnected, address, currentChainId, config.chains, setProvider, setAccount]);

  // Обработчик подключения кошелька
  const connectWallet = async () => {
    try {
      // Открываем модальное окно Reown
      if (window.reown) {
        await window.reown.connect();
      } else {
        // Fallback для MetaMask
        if (window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          });
          
          setProvider(provider);
          setAccount(accounts[0]);
          
          toast({
            title: 'Wallet Connected',
            description: 'Your wallet has been connected successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } else {
          toast({
            title: 'No Wallet Found',
            description: 'Please install MetaMask or another Ethereum wallet',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: 'Connection Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Обработчик отключения кошелька
  const disconnectWallet = async () => {
    try {
      disconnect();
      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected from the app',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Обработчик переключения сети
  const handleSwitchNetwork = async () => {
    try {
      if (window.reown) {
        await window.reown.openNetworkSelector();
      } else if (window.ethereum) {
        // Fallback для MetaMask
        toast({
          title: 'Network Switching',
          description: 'Please use your wallet to switch networks',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error switching network:', error);
    }
  };

  // Форматирование адреса кошелька
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <Box>
      {!isConnected ? (
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
              {currentChain ? `${currentChain.name} (${currentChain.nativeCurrency.symbol})` : 'Unknown Network'}
            </MenuButton>
            <MenuList
              bg="rgba(76, 29, 149, 0.9)"
              backdropFilter="blur(10px)"
              borderColor="rgba(255, 255, 255, 0.1)"
              boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
            >
              <MenuItem fontWeight="bold" isDisabled color="white" _disabled={{ color: "white", opacity: 0.8 }}>Switch Network</MenuItem>
              <Divider my={1} borderColor="rgba(255, 255, 255, 0.2)" />
              <MenuItem
                onClick={handleSwitchNetwork}
                bg="transparent"
                color="black"
                _hover={{
                  bg: "purple.600",
                  color: "white"
                }}
                _focus={{
                  bg: "purple.600",
                  color: "white"
                }}
                transition="all 0.2s"
              >
                <Text fontWeight="medium">
                  Switch Network
                </Text>
              </MenuItem>
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

export default ReownConnect;
