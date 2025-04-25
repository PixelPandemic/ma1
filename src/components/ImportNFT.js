import { useEffect, useState } from 'react';
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

// Адреса контрактов из файла .env
const META_ART_NFT_ADDRESS = "0xDB2218a06F3e95C3bAFe7c21a07d120585259d2D";
const AUCTION_ADDRESS = process.env.REACT_APP_AUCTION_ADDRESS || "0xEa1B11803b00EbeC0cF0f29525DB1011CB99a313";
const STAKING_ADDRESS = process.env.REACT_APP_STAKING_CONTRACT_ADDRESS || "0xaB4dCef0797a0E2d4F7a3BEC53B78B8aeAbf5881";

// Логируем адреса контрактов для отладки
console.log('ImportNFT - Staking Contract Address:', STAKING_ADDRESS);
console.log('ImportNFT - Auction Contract Address:', AUCTION_ADDRESS);
console.log('ImportNFT - NFT Contract Address:', META_ART_NFT_ADDRESS);

const ImportNFT = ({ provider, account }) => {
  const [walletNFTs, setWalletNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [isStaking, setIsStaking] = useState(false);
  const [isAuctioning, setIsAuctioning] = useState(false);
  const [price, setPrice] = useState('0.1');
  const [auctionDuration, setAuctionDuration] = useState(24); // Default 24 hours
  const [stakingContract, setStakingContract] = useState(null);

  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

  const toast = useToast();

  // Инициализация контрактов
  useEffect(() => {
    if (provider && account) {
      // Инициализируем контракт стейкинга
      const stakingContractInstance = new ethers.Contract(
        STAKING_ADDRESS,
        [
          "function stake(uint256 tokenId) external",
          "function unstake(uint256 tokenId) external",
          "function getStakedNFTs(address owner) view returns (uint256[])",
          "function getStakingInfo(uint256 tokenId) view returns (address owner, uint256 timestamp)",
          "function calculateRealTimeRewards(uint256 tokenId) view returns (uint256)",
          "function getTotalRewards(address owner) view returns (uint256)"
        ],
        provider.getSigner()
      );
      setStakingContract(stakingContractInstance);

      // Загружаем NFT из кошелька
      fetchWalletNFTs();
    }
  }, [provider, account]);

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
      // Список известных NFT контрактов
      const knownContracts = [
        META_ART_NFT_ADDRESS, // Основной контракт NFT
        // Добавьте другие известные контракты NFT здесь
      ];

      let allNFTs = [];

      // Получаем NFT из всех известных контрактов
      for (const contractAddress of knownContracts) {
        try {
          console.log(`Checking contract: ${contractAddress}`);

          // Проверяем, является ли адрес контрактом NFT
          const isNFT = await isNFTContract(contractAddress);
          if (!isNFT) {
            console.log(`Contract ${contractAddress} is not an NFT contract, skipping`);
            continue;
          }

          // Получаем информацию о контракте
          const contractInfo = await getContractInfo(contractAddress);
          console.log(`Contract info:`, contractInfo);

          // Создаем экземпляр контракта
          const nftContractInstance = new ethers.Contract(
            contractAddress,
            NFT_ABI,
            provider.getSigner()
          );

          // Проверяем, есть ли у контракта метод tokenOfOwnerByIndex
          let hasTokenOfOwnerByIndex = false;
          try {
            // Проверяем наличие метода в ABI
            hasTokenOfOwnerByIndex = nftContractInstance.interface.getFunction('tokenOfOwnerByIndex') !== null;
          } catch (error) {
            console.log(`Contract does not have tokenOfOwnerByIndex method, will use alternative approach`);
          }

          // Получаем количество NFT у пользователя
          const balance = await nftContractInstance.balanceOf(account);
          console.log(`Found ${balance.toString()} NFTs in contract ${contractAddress}`);

          // Если баланс равен 0, пропускаем контракт
          if (balance.toNumber() === 0) {
            console.log(`No NFTs found in contract ${contractAddress}, skipping`);
            continue;
          }

          // Получаем информацию о каждом NFT
          if (hasTokenOfOwnerByIndex) {
            // Используем tokenOfOwnerByIndex, если он доступен
            for (let i = 0; i < balance; i++) {
              try {
                // Получаем ID токена
                const tokenId = await nftContractInstance.tokenOfOwnerByIndex(account, i);
                console.log(`Processing token ID ${tokenId.toString()}`);

                // Получаем URI метаданных
                const tokenURI = await nftContractInstance.tokenURI(tokenId);
                console.log(`Token URI: ${tokenURI}`);

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
                      metadata = JSON.parse(jsonString);
                      console.log('Parsed Base64 metadata:', metadata);
                    } else {
                      throw new Error('Unsupported token URI format');
                    }
                  } else {
                    // Стандартный HTTP URL
                    const response = await fetch(url);
                    metadata = await response.json();
                    console.log('Fetched metadata:', metadata);
                  }
                } catch (error) {
                  console.error('Error fetching metadata:', error);
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
                console.log('ImportNFT - Metadata for NFT:', metadata);
                console.log('ImportNFT - Contract info:', contractInfo);

                // Формируем название NFT
                const nftName = metadata.name || `${contractInfo.name || 'NFT'} #${tokenId.toString()}`;
                console.log('ImportNFT - NFT name:', nftName);

                const nftData = {
                  tokenId: tokenId.toString(),
                  name: nftName,
                  description: metadata.description || 'No description available',
                  image: imageUrl || 'https://via.placeholder.com/150?text=No+Image',
                  contractAddress: contractAddress,
                  contractName: contractInfo.name || 'Unknown Contract'
                };

                console.log('ImportNFT - Adding NFT data:', nftData);
                allNFTs.push(nftData);
              } catch (error) {
                console.error(`Error processing NFT at index ${i}:`, error);
              }
            }
          } else {
            // Альтернативный подход: создаем тестовые NFT для демонстрации
            console.log(`Using alternative approach for contract ${contractAddress}`);

            // Создаем демо-NFT для тестирования интерфейса
            for (let i = 0; i < balance.toNumber(); i++) {
              const tokenId = i + 1; // Просто используем индекс как ID

              const nftData = {
                tokenId: tokenId.toString(),
                name: `${contractInfo.name || 'NFT'} #${tokenId}`,
                description: 'This is a demo NFT for testing the interface',
                image: 'https://via.placeholder.com/300/3498db/ffffff?text=Demo+NFT',
                contractAddress: contractAddress,
                contractName: contractInfo.name || 'Unknown Contract'
              };

              console.log('ImportNFT - Adding demo NFT data:', nftData);
              allNFTs.push(nftData);
            }
          }
        } catch (error) {
          console.error(`Error fetching NFTs from contract ${contractAddress}:`, error);
        }
      }

      console.log('All NFTs found:', allNFTs);
      setWalletNFTs(allNFTs);

      if (allNFTs.length === 0) {
        // Добавляем демо-NFT для тестирования интерфейса
        const demoNFTs = [
          {
            tokenId: '1',
            name: 'Demo NFT #1',
            description: 'This is a demo NFT for testing the interface',
            image: 'https://via.placeholder.com/300/e74c3c/ffffff?text=Demo+NFT+1',
            contractAddress: META_ART_NFT_ADDRESS,
            contractName: 'Demo NFT Collection'
          },
          {
            tokenId: '2',
            name: 'Demo NFT #2',
            description: 'This is another demo NFT for testing',
            image: 'https://via.placeholder.com/300/2ecc71/ffffff?text=Demo+NFT+2',
            contractAddress: META_ART_NFT_ADDRESS,
            contractName: 'Demo NFT Collection'
          }
        ];

        console.log('No NFTs found, adding demo NFTs:', demoNFTs);
        setWalletNFTs(demoNFTs);

        toast({
          title: 'Demo Mode',
          description: 'No real NFTs found. Showing demo NFTs for testing.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);

      // В случае ошибки показываем демо-NFT
      const demoNFTs = [
        {
          tokenId: '1',
          name: 'Demo NFT #1',
          description: 'This is a demo NFT for testing the interface',
          image: 'https://via.placeholder.com/300/e74c3c/ffffff?text=Demo+NFT+1',
          contractAddress: META_ART_NFT_ADDRESS,
          contractName: 'Demo NFT Collection'
        },
        {
          tokenId: '2',
          name: 'Demo NFT #2',
          description: 'This is another demo NFT for testing',
          image: 'https://via.placeholder.com/300/2ecc71/ffffff?text=Demo+NFT+2',
          contractAddress: META_ART_NFT_ADDRESS,
          contractName: 'Demo NFT Collection'
        }
      ];

      console.log('Error fetching NFTs, showing demo NFTs:', demoNFTs);
      setWalletNFTs(demoNFTs);

      toast({
        title: 'Error Fetching NFTs',
        description: 'Failed to fetch real NFTs. Showing demo NFTs for testing.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to check if NFT is approved
  const checkIfApproved = async (nft, targetAddress) => {
    try {
      // Create an instance of the NFT contract
      const nftContractInstance = new ethers.Contract(
        nft.contractAddress,
        NFT_ABI,
        provider.getSigner()
      );

      // Use isApprovedForAll instead of getApproved
      const isApprovedForAll = await nftContractInstance.isApprovedForAll(account, targetAddress);
      console.log("Is approved for all:", isApprovedForAll);

      // Also check approval for the specific token
      const approved = await nftContractInstance.getApproved(nft.tokenId);
      console.log("Current approved address for token:", approved);

      return isApprovedForAll || approved.toLowerCase() === targetAddress.toLowerCase();
    } catch (error) {
      console.error("Error checking approval:", error);
      return false;
    }
  };

  // Function to approve NFT
  const approveNFT = async (nft, targetAddress) => {
    try {
      // Create an instance of the NFT contract
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

      // Use setApprovalForAll instead of approve
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

  // Function for staking NFT
  const stakeNFT = async (nft) => {
    if (!provider || !account || !stakingContract) return;

    try {
      // Проверяем, одобрен ли NFT для стейкинга
      const isApproved = await checkIfApproved(nft, STAKING_ADDRESS);

      if (!isApproved) {
        // Если не одобрен, одобряем
        const approved = await approveNFT(nft, STAKING_ADDRESS);
        if (!approved) return;
      }

      toast({
        title: 'Staking NFT',
        description: 'Please confirm the transaction in your wallet',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      // Call the staking function
      const tx = await stakingContract.stake(nft.tokenId, { gasLimit: 500000 });
      await tx.wait();

      toast({
        title: 'Staking Successful',
        description: `Your NFT ${nft.name} is now staked and earning rewards!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Update the NFT list
      fetchWalletNFTs();

      // Create an event to update the staked NFTs list
      const event = new CustomEvent('refreshStakedNFTs');
      window.dispatchEvent(event);

      // Offer to go to the staking tab
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

      return true;
    } catch (error) {
      console.error("Error staking NFT:", error);
      toast({
        title: 'Staking Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };

  // Функция для создания аукциона NFT
  const createAuction = async (nft, startingPrice, duration) => {
    if (!provider || !account) return;

    try {
      // Получаем адрес контракта аукциона
      const auctionAddress = AUCTION_ADDRESS;
      console.log(`Auction contract address: ${auctionAddress}`);

      // Проверяем, одобрен ли NFT для аукциона
      const isApproved = await checkIfApproved(nft, auctionAddress);

      if (!isApproved) {
        // Если не одобрен, одобряем
        const approved = await approveNFT(nft, auctionAddress);
        if (!approved) return;
      }

      // Создаем экземпляр контракта аукциона
      const auctionContract = new ethers.Contract(
        auctionAddress,
        NFT_AUCTION_ABI,
        provider.getSigner()
      );

      // Преобразуем цену в wei
      const priceInWei = ethers.utils.parseEther(startingPrice.toString());
      // Преобразуем длительность в секунды
      const durationInSeconds = duration * 60 * 60; // Часы в секунды

      toast({
        title: 'Creating Auction',
        description: 'Please confirm the transaction in your wallet',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      // Create the auction
      const tx = await auctionContract.createAuction(
        nft.contractAddress,
        nft.tokenId,
        priceInWei,
        durationInSeconds,
        { gasLimit: 500000 }
      );

      await tx.wait();

      toast({
        title: 'Auction Created',
        description: `Your NFT ${nft.name} is now on auction with starting price ${startingPrice} ETH!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Update the NFT list
      fetchWalletNFTs();

      // Offer to go to the auctions tab
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

      return true;
    } catch (error) {
      console.error("Error creating auction:", error);
      toast({
        title: 'Auction Creation Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };

  // Загружаем NFT при монтировании компонента
  useEffect(() => {
    if (provider && account) {
      fetchWalletNFTs();
    }
  }, [provider, account]);



  // Обработчик открытия модального окна для аукциона
  const handleOpenAuctionModal = (nft) => {
    setSelectedNFT(nft);
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

  // Обработчик создания аукциона
  const handleCreateAuction = async () => {
    if (!selectedNFT) return;

    setIsAuctioning(true);
    try {
      await createAuction(selectedNFT, price, auctionDuration);
      onModalClose();
    } finally {
      setIsAuctioning(false);
      setSelectedNFT(null);
    }
  };

  return (
    <Box p={4}>
      <Heading as="h2" size="lg" mb={4}>
        Your NFTs
      </Heading>
      <Text mb={4} whiteSpace="pre-wrap" overflowWrap="break-word" wordBreak="break-word" color="white">
  Here you can see all NFTs in your wallet.
  You can add them to staking or list them for auction directly.
</Text>

      <Divider my={4} />

      {loading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
          <Text mt={4}>Loading your NFTs...</Text>
        </Box>
      ) : walletNFTs.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text fontSize="lg">You don't have any NFTs in your wallet.</Text>
          <Text mt={2} color="gray.500">You can create a new NFT in the "Mint NFT" tab.</Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing={6}>
          {walletNFTs.map((nft) => (
            <Box
              key={`${nft.contractAddress}-${nft.tokenId}`}
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              boxShadow="md"
              _hover={{ boxShadow: 'lg' }}
              className="no-flicker"
              bg="rgba(0, 0, 0, 0.81)"
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
                <Heading as="h3" size="sm" mb={2} noOfLines={1} color="#4A5568">
                  {nft.name ? nft.name.replace(" #Common", "") : ""}
                </Heading>

                <Text fontSize="sm" color="white" mb={2} noOfLines={2}>
                  {nft.description || 'No description'}
                </Text>

                <Badge mb={3} colorScheme="purple">
                  ID: {nft.tokenId}
                </Badge>

                <Text fontSize="xs" color="gray.50" mb={3}>
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
      )}

      {/* Modal window for creating an auction */}
      <Modal isOpen={isModalOpen} onClose={onModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Auction</ModalHeader>
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
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="purple"
              mr={3}
              onClick={handleCreateAuction}
              isLoading={isAuctioning}
              loadingText="Creating..."
            >
              Create Auction
            </Button>
            <Button onClick={onModalClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ImportNFT;
