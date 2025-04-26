import { useState, useEffect } from 'react';
import { Box, Text, Button, HStack, VStack, Icon, useToast } from '@chakra-ui/react';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const NetworkWarning = ({ provider }) => {
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const checkNetwork = async () => {
      if (!provider) return;

      try {
        const network = await provider.getNetwork();
        setCurrentNetwork(network);

        // Проверяем, что мы в сети Polygon Amoy (chainId 80002)
        if (network.chainId !== 80002) {
          setIsWrongNetwork(true);
        } else {
          setIsWrongNetwork(false);
        }
      } catch (error) {
        console.error("Error checking network:", error);
      }
    };

    checkNetwork();

    // Слушаем изменения сети
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        checkNetwork();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', checkNetwork);
      }
    };
  }, [provider]);

  const switchToAmoy = async () => {
    if (!window.ethereum) return;

    try {
      // Пытаемся переключиться на Polygon Amoy
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13882' }], // 80002 в шестнадцатеричном формате
      });

      toast({
        title: 'Network Switched',
        description: 'Successfully connected to Polygon Amoy Testnet',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
        containerStyle: {
          zIndex: 9999
        }
      });
    } catch (switchError) {
      // Если сеть не добавлена, добавляем ее
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x13882', // 80002 в шестнадцатеричном формате
                chainName: 'Polygon Amoy Testnet',
                nativeCurrency: {
                  name: 'POL',
                  symbol: 'POL',
                  decimals: 18,
                },
                rpcUrls: ['https://rpc-amoy.polygon.technology/'],
                blockExplorerUrls: ['https://www.oklink.com/amoy'],
              },
            ],
          });
          
          toast({
            title: 'Network Added',
            description: 'Polygon Amoy Testnet has been added to your wallet',
            status: 'success',
            duration: 5000,
            isClosable: true,
            position: 'top',
            containerStyle: {
              zIndex: 9999
            }
          });
        } catch (addError) {
          console.error('Error adding Polygon Amoy network:', addError);
          
          toast({
            title: 'Error',
            description: 'Could not add Polygon Amoy network to your wallet',
            status: 'error',
            duration: 5000,
            isClosable: true,
            position: 'top',
            containerStyle: {
              zIndex: 9999
            }
          });
        }
      } else {
        console.error('Error switching to Polygon Amoy network:', switchError);
        
        toast({
          title: 'Error',
          description: 'Could not switch to Polygon Amoy network',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
          containerStyle: {
            zIndex: 9999
          }
        });
      }
    }
  };

  if (!isWrongNetwork || !currentNetwork) return null;

  return (
    <Box 
      className="network-warning"
      position="fixed"
      top="80px"
      left="50%"
      transform="translateX(-50%)"
      zIndex="9999"
      width={{ base: "90%", md: "auto" }}
      maxWidth="600px"
      bg="rgba(0, 0, 0, 0.8)"
      color="white"
      p={4}
      borderRadius="md"
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
      backdropFilter="blur(10px)"
      border="1px solid rgba(255, 255, 255, 0.1)"
    >
      <VStack align="stretch" spacing={3}>
        <HStack>
          <Icon as={FiAlertTriangle} color="red.400" boxSize={6} />
          <Text fontWeight="bold">Wrong Network Detected</Text>
        </HStack>
        
        <Text>
          You are currently connected to <strong>{currentNetwork.name || `Chain ID: ${currentNetwork.chainId}`}</strong>.
          This application requires <strong>Polygon Amoy Testnet</strong> to function properly.
        </Text>
        
        <Button 
          leftIcon={<FiCheckCircle />}
          colorScheme="green" 
          onClick={switchToAmoy}
          size="md"
          width="full"
        >
          Switch to Polygon Amoy
        </Button>
      </VStack>
    </Box>
  );
};

export default NetworkWarning;
