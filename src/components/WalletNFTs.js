import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Image,
  VStack,
  HStack,
  Spinner,
  useToast,
  Badge,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react';
import { ethers } from 'ethers';

// Упрощенный ABI для взаимодействия с NFT
const NFT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)"
];

// ABI для взаимодействия с контрактом аукционов
const NFT_AUCTION_ABI = [
  "function createAuction(address _nftContract, uint256 _tokenId, uint256 _startingPrice, uint256 _duration) external",
  "function auctions(uint256) view returns (uint256 id, address seller, address nftContract, uint256 tokenId, uint256 startingPrice, uint256 endTime, address highestBidder, uint256 highestBid, bool ended)"
];

const WalletNFTs = ({ provider, account, stakingContract, nftContract }) => {
  const [walletNFTs, setWalletNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [isStaking, setIsStaking] = useState(false);
  const [isAuctioning, setIsAuctioning] = useState(false);
  const [price, setPrice] = useState('0.1');
  const [auctionDuration, setAuctionDuration] = useState(24); // Default 24 hours
  const [actionType, setActionType] = useState(''); // 'stake' или 'auction'

  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

  const toast = useToast();

  // Адрес контракта аукциона из .env
  const AUCTION_ADDRESS = process.env.REACT_APP_AUCTION_ADDRESS;

  // Функция для получения информации о контракте
  const getContractInfo = async (contractAddress) => {
    try {
      const contract = new ethers.Contract(
        contractAddress,
        NFT_ABI,
        provider.getSigner()
      );

      const name = await contract.name();
      const symbol = await contract.symbol();

      return { name, symbol };
    } catch (error) {
      console.error('Error getting contract info:', error);
      return { name: 'Unknown NFT', symbol: 'NFT' };
    }
  };

  // Функция для проверки, является ли адрес контрактом NFT
  const isNFTContract = async (address) => {
    try {
      const contract = new ethers.Contract(
        address,
        NFT_ABI,
        provider.getSigner()
      );

      // Пробуем вызвать методы, которые должны быть у NFT контракта
      await contract.name();
      await contract.symbol();
      await contract.balanceOf(account);

      return true;
    } catch (error) {
      console.error(`Address ${address} is not an NFT contract:`, error);
      return false;
    }
  };

  // Функция для получения всех NFT из кошелька
  const fetchWalletNFTs = async () => {
    if (!provider || !account) return;

    setLoading(true);
    try {
      // Получаем список всех транзакций пользователя, чтобы найти контракты NFT
      const etherscanProvider = new ethers.providers.EtherscanProvider(
        'maticmum', // Polygon Mumbai
        process.env.REACT_APP_ETHERSCAN_API_KEY
      );

      // Список известных NFT контрактов
      const knownContracts = [
        nftContract.address, // Основной контракт NFT
      ];

      // Добавляем другие известные контракты NFT
      // Можно расширить этот список в будущем

      let allNFTs = [];

      // Получаем NFT из всех известных контрактов
      for (const contractAddress of knownContracts) {
        try {
          // Проверяем, является ли адрес контрактом NFT
          const isNFT = await isNFTContract(contractAddress);
          if (!isNFT) continue;

          // Получаем информацию о контракте
          const contractInfo = await getContractInfo(contractAddress);

          // Создаем экземпляр контракта
          const nftContractInstance = new ethers.Contract(
            contractAddress,
            NFT_ABI,
            provider.getSigner()
          );

          // Получаем количество NFT у пользователя
          const balance = await nftContractInstance.balanceOf(account);
          console.log(`Found ${balance.toString()} NFTs in contract ${contractAddress}`);

          // Получаем информацию о каждом NFT
          for (let i = 0; i < balance; i++) {
            try {
              // Получаем ID токена
              const tokenId = await nftContractInstance.tokenOfOwnerByIndex(account, i);
              console.log(`Processing token ID ${tokenId.toString()}`);

              // Получаем URI метаданных
              const tokenURI = await nftContractInstance.tokenURI(tokenId);
              console.log(`WalletNFTs - Token URI: ${tokenURI}`);

              // Получаем метаданные
              let metadata;
              try {
                // Обрабатываем разные форматы URI
                let url = tokenURI;
                if (url.startsWith('ipfs://')) {
                  url = url.replace('ipfs://', 'https://ipfs.io/ipfs/');
                } else if (url.startsWith('ar://')) {
                  url = url.replace('ar://', 'https://arweave.net/');
                } else if (!url.startsWith('http')) {
                  // Если это не URL, а например данные Base64
                  if (url.includes('data:application/json;base64,')) {
                    const base64Data = url.split('base64,')[1];
                    const jsonString = atob(base64Data);
                    console.log('WalletNFTs - Base64 JSON string:', jsonString);
                    try {
                      metadata = JSON.parse(jsonString);
                      console.log('WalletNFTs - Parsed Base64 metadata:', metadata);
                    } catch (e) {
                      console.error('WalletNFTs - Error parsing Base64 JSON:', e);
                      metadata = {
                        name: `${contractInfo.name || 'NFT'} #${tokenId.toString()}`,
                        description: 'No description available',
                        image: '/no-image.svg'
                      };
                    }
                  } else {
                    throw new Error('Unsupported token URI format');
                  }
                } else {
                  // Стандартный HTTP URL
                  const response = await fetch(url);
                  metadata = await response.json();
                  console.log('WalletNFTs - Fetched metadata:', metadata);
                }
              } catch (error) {
                console.error('WalletNFTs - Error fetching metadata:', error);
                metadata = {
                  name: `${contractInfo.name || 'NFT'} #${tokenId.toString()}`,
                  description: 'No description available',
                  image: '/no-image.svg'
                };
              }

              // Преобразуем URL изображения, если необходимо
              let imageUrl = metadata.image;
              if (imageUrl) {
                if (imageUrl.startsWith('ipfs://')) {
                  imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
                } else if (imageUrl.startsWith('ar://')) {
                  imageUrl = imageUrl.replace('ar://', 'https://arweave.net/');
                } else if (imageUrl.startsWith('data:image/')) {
                  // Данные Base64 можно использовать напрямую
                  // Ничего не делаем
                }
              }

              // Логируем метаданные NFT
              console.log('WalletNFTs - Metadata for NFT:', metadata);
              console.log('WalletNFTs - Metadata name:', metadata.name);
              console.log('WalletNFTs - Metadata description:', metadata.description);
              console.log('WalletNFTs - Contract info:', contractInfo);

              // Формируем название NFT
              const nftName = metadata.name || `${contractInfo.name || 'NFT'} #${tokenId.toString()}`;
              console.log('NFT name:', nftName);

              // Формируем описание NFT
              const nftDescription = metadata.description || 'No description available';
              console.log('NFT description:', nftDescription);

              // Создаем объект с данными NFT
              const nftData = {
                tokenId: tokenId.toString(),
                name: nftName,
                description: nftDescription,
                image: imageUrl || 'https://via.placeholder.com/150?text=No+Image',
                contractAddress: contractAddress,
                contractName: contractInfo.name || 'Unknown Contract'
              };

              // Дополнительное логирование
              console.log('WalletNFTs - NFT Data:', nftData);
              console.log('WalletNFTs - NFT Data name:', nftData.name);
              console.log('WalletNFTs - NFT Data description:', nftData.description);

              console.log('Adding NFT data:', nftData);
              allNFTs.push(nftData);
            } catch (error) {
              console.error(`Error processing NFT at index ${i}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error fetching NFTs from contract ${contractAddress}:`, error);
        }
      }

      console.log('All NFTs found:', allNFTs);
      setWalletNFTs(allNFTs);

      if (allNFTs.length === 0) {
        toast({
          title: 'No NFTs Found',
          description: 'No NFTs found in your wallet',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch NFTs from your wallet',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Функция для проверки одобрения NFT
  const checkIfApproved = async (nft, targetAddress) => {
    try {
      // Создаем экземпляр контракта NFT
      const nftContractInstance = new ethers.Contract(
        nft.contractAddress,
        NFT_ABI,
        provider.getSigner()
      );

      // Используем isApprovedForAll вместо getApproved
      const isApprovedForAll = await nftContractInstance.isApprovedForAll(account, targetAddress);
      console.log("Is approved for all:", isApprovedForAll);

      // Также проверяем одобрение для конкретного токена
      const approved = await nftContractInstance.getApproved(nft.tokenId);
      console.log("Current approved address for token:", approved);

      return isApprovedForAll || approved.toLowerCase() === targetAddress.toLowerCase();
    } catch (error) {
      console.error("Error checking approval:", error);
      return false;
    }
  };

  // Функция для одобрения NFT
  const approveNFT = async (nft, targetAddress) => {
    try {
      // Создаем экземпляр контракта NFT
      const nftContractInstance = new ethers.Contract(
        nft.contractAddress,
        NFT_ABI,
        provider.getSigner()
      );

      console.log("Approving NFT for address:", targetAddress);

      toast({
        title: 'Approving NFT',
        description: 'Please confirm the transaction in your wallet',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      // Используем setApprovalForAll вместо approve
      const tx = await nftContractInstance.setApprovalForAll(targetAddress, true, { gasLimit: 500000 });
      await tx.wait();

      toast({
        title: 'Approval Successful',
        description: 'Your NFT is now approved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return true;
    } catch (error) {
      console.error("Error approving NFT:", error);
      toast({
        title: 'Approval Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };

  // Функция для стейкинга NFT
  const stakeNFT = async (nft) => {
    if (!stakingContract || !provider || !account) return;

    setIsStaking(true);
    try {
      // Проверяем, одобрен ли NFT для контракта стейкинга
      const stakingAddress = await stakingContract.address;
      const isApproved = await checkIfApproved(nft, stakingAddress);
      if (!isApproved) {
        const approved = await approveNFT(nft, stakingAddress);
        if (!approved) {
          setIsStaking(false);
          return;
        }
      }

      toast({
        title: 'Staking NFT',
        description: 'Please confirm the transaction in your wallet',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      // Вызываем функцию stake контракта стейкинга
      const tx = await stakingContract.stake(nft.tokenId, { gasLimit: 500000 });
      await tx.wait();

      // Отправляем событие обновления списка стейкнутых NFT
      const refreshEvent = new CustomEvent('refreshStakedNFTs');
      window.dispatchEvent(refreshEvent);

      // Show notification with button to go to "Staked NFTs" section
      toast({
        title: 'Go to Staking?',
        description: 'Your NFT has been successfully staked. Would you like to go to your staked NFTs?',
        status: 'success',
        duration: 10000,
        isClosable: true,
        position: 'bottom-right',
        render: ({ onClose }) => (
          <Box p={3} bg="green.100" borderRadius="md" boxShadow="md">
            <VStack align="start" spacing={2}>
              <Heading size="sm">Go to Staking?</Heading>
              <Text>Your NFT has been successfully staked.</Text>
              <HStack spacing={2}>
                <Button
                  size="sm"
                  colorScheme="green"
                  onClick={() => {
                    // Use an event to switch to the Staking tab (index 1)
                    const event = new CustomEvent('switchTab', { detail: { tabIndex: 1 } });
                    window.dispatchEvent(event);
                    onClose();
                  }}
                >
                  Go to Staking
                </Button>
                <Button size="sm" variant="ghost" onClick={onClose}>Later</Button>
              </HStack>
            </VStack>
          </Box>
        )
      });

      // Обновляем список NFT в кошельке
      fetchWalletNFTs();
    } catch (error) {
      console.error("Error staking NFT:", error);
      toast({
        title: 'Staking Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsStaking(false);
      onModalClose();
    }
  };

  // Функция для создания аукциона
  const createAuction = async (nft, startingPrice, duration) => {
    if (!provider || !account) return;

    setIsAuctioning(true);
    try {
      // Проверяем, одобрен ли NFT для контракта аукционов
      const isApproved = await checkIfApproved(nft, AUCTION_ADDRESS);
      if (!isApproved) {
        const approved = await approveNFT(nft, AUCTION_ADDRESS);
        if (!approved) {
          setIsAuctioning(false);
          return;
        }
      }

      toast({
        title: 'Creating Auction',
        description: 'Please confirm the transaction in your wallet',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      // Создаем экземпляр контракта NFT
      const nftContractInstance = new ethers.Contract(
        nft.contractAddress,
        NFT_ABI,
        provider.getSigner()
      );

      // Создаем экземпляр контракта аукционов
      const auctionContract = new ethers.Contract(
        AUCTION_ADDRESS,
        NFT_AUCTION_ABI,
        provider.getSigner()
      );

      // Преобразуем цену в wei
      const priceInWei = ethers.utils.parseEther(startingPrice.toString());

      // Преобразуем длительность в секунды
      const durationInSeconds = duration * 3600; // часы в секунды

      console.log('Creating auction with parameters:');
      console.log('- NFT Contract:', nft.contractAddress);
      console.log('- Token ID:', nft.tokenId);
      console.log('- Starting Price:', priceInWei.toString());
      console.log('- Duration:', durationInSeconds);

      // Вызываем функцию createAuction контракта с увеличенным лимитом газа
      const tx = await auctionContract.createAuction(
        nft.contractAddress,
        nft.tokenId,
        priceInWei,
        durationInSeconds,
        { gasLimit: 500000 }
      );

      console.log('Transaction hash:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed!');

      toast({
        title: 'Auction Created',
        description: `Your NFT ${nft.name} is now on auction with starting price ${startingPrice} ETH!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Show notification with button to go to Auctions tab
      toast({
        title: 'Go to Auctions?',
        description: 'Your NFT has been successfully listed for auction. Would you like to go to the auctions page?',
        status: 'success',
        duration: 10000,
        isClosable: true,
        position: 'bottom-right',
        render: ({ onClose }) => (
          <Box p={3} bg="green.100" borderRadius="md" boxShadow="md">
            <VStack align="start" spacing={2}>
              <Heading size="sm">Go to Auctions?</Heading>
              <Text>Your NFT has been successfully listed for auction.</Text>
              <HStack spacing={2}>
                <Button
                  size="sm"
                  colorScheme="green"
                  onClick={() => {
                    // Use an event to switch to the Auctions tab (index 2)
                    const event = new CustomEvent('switchTab', { detail: { tabIndex: 2 } });
                    window.dispatchEvent(event);
                    onClose();
                  }}
                >
                  Go to Auctions
                </Button>
                <Button size="sm" variant="ghost" onClick={onClose}>Later</Button>
              </HStack>
            </VStack>
          </Box>
        )
      });

      // Обновляем список NFT в кошельке
      fetchWalletNFTs();
    } catch (error) {
      console.error("Error creating auction:", error);

      // Получаем более подробную информацию об ошибке
      let errorMessage = error.message;
      if (error.data) {
        console.log('Error data:', error.data);
        errorMessage += ` (${error.data})`;
      }
      if (error.error) {
        console.log('Inner error:', error.error);
        errorMessage += ` - ${error.error.message || JSON.stringify(error.error)}`;
      }

      toast({
        title: 'Auction Creation Failed',
        description: errorMessage || 'Failed to create auction',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAuctioning(false);
      onModalClose();
    }
  };

  // Обработчик открытия модального окна для аукциона
  const handleOpenAuctionModal = (nft) => {
    setSelectedNFT(nft);
    setActionType('auction');
    setPrice('0.1');
    setAuctionDuration(24);
    onModalOpen();
  };

  // Обработчик стейкинга NFT
  const handleStakeNFT = async (nft) => {
    setSelectedNFT(nft);
    setIsStaking(true);
    try {
      await stakeNFT(nft);
    } finally {
      setIsStaking(false);
      setSelectedNFT(null);
    }
  };

  // Обработчик подтверждения действия
  const handleConfirmAction = async () => {
    if (!selectedNFT) return;

    if (actionType === 'stake') {
      await stakeNFT(selectedNFT);
    } else if (actionType === 'auction') {
      setIsAuctioning(true);
      try {
        await createAuction(selectedNFT, price, auctionDuration);
        onModalClose();
      } finally {
        setIsAuctioning(false);
        setSelectedNFT(null);
      }
    }
  };

  // Загружаем NFT при монтировании компонента
  useEffect(() => {
    if (provider && account) {
      fetchWalletNFTs();
    }
  }, [provider, account]);

  return (
    <Box p={4}>
      <Heading as="h2" size="lg" mb={4}>Your Wallet NFTs</Heading>
      <Text mb={4}>
        Browse NFTs in your wallet and send them directly to staking or auction.
      </Text>

      <Button
        colorScheme="purple"
        onClick={fetchWalletNFTs}
        isLoading={loading}
        loadingText="Fetching NFTs"
        leftIcon={<span>🔄</span>}
        mb={6}
      >
        Refresh NFTs
      </Button>

      <Divider my={4} />

      {loading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
          <Text mt={4}>Loading your NFTs...</Text>
        </Box>
      ) : walletNFTs.length > 0 ? (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
          {walletNFTs.map((nft) => (
            <Box
              key={`${nft.contractAddress}-${nft.tokenId}`}
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              boxShadow="md"
              _hover={{ boxShadow: 'lg' }}
              className="no-flicker"
            >
              <Image
                src={nft.image}
                alt={nft.name}
                height="200px"
                width="100%"
                objectFit="cover"
                fallback={<Box height="200px" bg="gray.100" display="flex" alignItems="center" justifyContent="center"><Text>No Image</Text></Box>}
              />

              <Box p={4}>
                <Heading as="h3" size="md" mb={2} noOfLines={1}>
                  {nft.name}
                </Heading>

                <Text fontSize="sm" color="gray.500" mb={2} noOfLines={2}>
                  {nft.description || 'No description'}
                </Text>

                <Badge mb={3} colorScheme="purple">
                  ID: {nft.tokenId}
                </Badge>

                <Text fontSize="xs" color="gray.500" mb={3}>
                  Contract: {nft.contractName || 'Unknown'}
                </Text>

                <HStack spacing={2} mt={3}>
                  <Button
                    colorScheme="teal"
                    size="sm"
                    width="50%"
                    onClick={() => handleStakeNFT(nft)}
                    isLoading={isStaking && selectedNFT?.tokenId === nft.tokenId}
                    loadingText="Staking..."
                  >
                    Stake
                  </Button>

                  <Button
                    colorScheme="purple"
                    size="sm"
                    width="50%"
                    onClick={() => handleOpenAuctionModal(nft)}
                    isLoading={isAuctioning && selectedNFT?.tokenId === nft.tokenId}
                    loadingText="Creating..."
                  >
                    Auction
                  </Button>
                </HStack>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      ) : (
        <Box textAlign="center" py={10}>
          <Text fontSize="lg">You don't have any NFTs in your wallet.</Text>
          <Text mt={2} color="gray.500">You can create a new NFT in the "Mint NFT" tab.</Text>
        </Box>
      )}

      {/* Modal window for creating an auction */}
      <Modal isOpen={isModalOpen} onClose={onModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {actionType === 'stake' ? 'Stake NFT' : 'Create Auction'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedNFT && (
              <>
                <Box mb={4} textAlign="center">
                  <Image
                    src={selectedNFT.image}
                    alt={selectedNFT.name}
                    maxHeight="200px"
                    mx="auto"
                    borderRadius="md"
                  />
                  <Heading as="h4" size="md" mt={2}>
                    {selectedNFT.name}
                  </Heading>
                </Box>

                {actionType === 'stake' ? (
                  <Text mb={4}>
                    Are you sure you want to stake this NFT? You will earn ART tokens as rewards.
                  </Text>
                ) : (
                  <>
                    <FormControl mb={4}>
                      <FormLabel>Starting Price (ETH)</FormLabel>
                      <NumberInput
                        defaultValue={0.1}
                        min={0.001}
                        precision={3}
                        onChange={(valueString) => setPrice(valueString)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Duration (hours)</FormLabel>
                      <NumberInput
                        defaultValue={24}
                        min={1}
                        max={168} // 7 days
                        onChange={(valueString) => setAuctionDuration(parseInt(valueString))}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </>
                )}
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme={actionType === 'stake' ? 'teal' : 'purple'}
              mr={3}
              onClick={handleConfirmAction}
              isLoading={isStaking || isAuctioning}
              loadingText={actionType === 'stake' ? 'Staking...' : 'Creating...'}
            >
              {actionType === 'stake' ? 'Stake NFT' : 'Create Auction'}
            </Button>
            <Button onClick={onModalClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default WalletNFTs;
