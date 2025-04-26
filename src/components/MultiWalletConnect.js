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
import { FiPower, FiChevronDown, FiExternalLink } from 'react-icons/fi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect, useNetwork, useSwitchNetwork } from '@wagmi/core';
import { getChainName, getChainCurrency, chains } from '../utils/web3Config';

const MultiWalletConnect = ({ setProvider, setAccount }) => {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const toast = useToast();

  const [currentChain, setCurrentChain] = useState(null);
  const [nativeCurrency, setNativeCurrency] = useState('POL');

  // Обновляем состояние при изменении подключения
  useEffect(() => {
    if (isConnected && address) {
      // Создаем провайдер ethers для обратной совместимости
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // Устанавливаем провайдер и адрес в родительском компоненте
      setProvider(provider);
      setAccount(address);

      // Обновляем информацию о текущей сети
      if (chain) {
        setCurrentChain(chain);
        setNativeCurrency(getChainCurrency(chain.id));
      }
    } else {
      // Сбрасываем состояние при отключении
      setProvider(null);
      setAccount(null);
      setCurrentChain(null);
    }
  }, [isConnected, address, chain, setProvider, setAccount]);

  // Обработчик отключения кошелька
  const handleDisconnect = () => {
    disconnect();
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected from the app',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // Обработчик переключения сети
  const handleSwitchNetwork = (chainId) => {
    switchNetwork(chainId);
  };

  // Форматирование адреса кошелька
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Получение цвета бейджа для сети
  const getChainColor = (chainId) => {
    const colorMap = {
      80002: 'purple', // Polygon Amoy
      1: 'blue',       // Ethereum
      137: 'purple',   // Polygon
      56: 'yellow',    // BSC
      42161: 'blue'    // Arbitrum
    };

    return colorMap[chainId] || 'gray';
  };

  return (
    <Box>
      {!isConnected ? (
        <Button
          colorScheme="purple"
          onClick={() => open()}
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
              colorScheme={getChainColor(chain?.id)}
              rightIcon={<FiChevronDown />}
            >
              {getChainName(chain?.id)}
            </MenuButton>
            <MenuList>
              <MenuItem fontWeight="bold" isDisabled>Switch Network</MenuItem>
              <Divider my={1} />
              {chains.map((supportedChain) => (
                <MenuItem
                  key={supportedChain.id}
                  onClick={() => handleSwitchNetwork(supportedChain.id)}
                  isDisabled={chain?.id === supportedChain.id}
                >
                  <Flex align="center">
                    <Badge
                      colorScheme={getChainColor(supportedChain.id)}
                      mr={2}
                      px={2}
                      py={1}
                      borderRadius="md"
                    >
                      {supportedChain.name}
                    </Badge>
                    {chain?.id === supportedChain.id && (
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
            onClick={handleDisconnect}
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

export default MultiWalletConnect;
