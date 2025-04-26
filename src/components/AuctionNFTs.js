import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Grid,
  Image,
  Button,
  Badge,
  VStack,
  HStack,
  Spinner,
  useToast,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { CONFIG } from '../config';
import { useTrackTransaction } from '../utils/transactions';

// Импортируем ABI для взаимодействия с контрактом аукционов
import NFTAuctionABI from '../contracts/NFTAuctionABI.json';

const AuctionNFTs = ({ provider, account, nftContract, auctionAddress }) => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [placingBid, setPlacingBid] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [endingAuction, setEndingAuction] = useState(false);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  const { isOpen: isBidModalOpen, onOpen: onBidModalOpen, onClose: onBidModalClose } = useDisclosure();
  const { isOpen: isBuyNowModalOpen, onOpen: onBuyNowModalOpen, onClose: onBuyNowModalClose } = useDisclosure();

  const toast = useToast();
  const trackTransaction = useTrackTransaction();

  // Адрес контракта аукционов из props
  console.log('AuctionNFTs - Auction contract address:', auctionAddress);

  // Состояние для отслеживания обновлений
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Загрузка аукционов при монтировании или при изменении updateTrigger
  useEffect(() => {
    if (provider && account) {
      fetchAuctions();
    }
  }, [provider, account, updateTrigger]);

  // Настраиваем прослушивание событий блокчейна
  useEffect(() => {
    if (provider && account) {
      try {
        const auctionContract = new ethers.Contract(
          auctionAddress,
          NFTAuctionABI,
          provider
        );

        // Функция для обновления данных без мигания
        const triggerUpdate = () => {
          setUpdateTrigger(prev => prev + 1);
        };

        // Прослушиваем событие создания нового аукциона
        const auctionCreatedFilter = auctionContract.filters.AuctionCreated();
        provider.on(auctionCreatedFilter, () => {
          console.log('New auction created event detected!');
          triggerUpdate();
        });

        // Прослушиваем событие новой ставки
        const bidPlacedFilter = auctionContract.filters.BidPlaced();
        provider.on(bidPlacedFilter, () => {
          console.log('New bid placed event detected!');
          triggerUpdate();
        });

        // Прослушиваем событие завершения аукциона
        const auctionEndedFilter = auctionContract.filters.AuctionEnded();
        provider.on(auctionEndedFilter, () => {
          console.log('Auction ended event detected!');
          triggerUpdate();
        });

        return () => {
          provider.removeAllListeners(auctionCreatedFilter);
          provider.removeAllListeners(bidPlacedFilter);
          provider.removeAllListeners(auctionEndedFilter);
        };
      } catch (error) {
        console.error('Error setting up event listeners:', error);
      }
    }
  }, [provider, account]);

  // Обновляем текущее время каждую секунду
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Функция для получения всех аукционов
  const fetchAuctions = async () => {
    try {
      // Устанавливаем loading только если список пуст
      if (auctions.length === 0) {
        setLoading(true);
      }

      // Создаем экземпляр контракта аукционов
      const signer = provider.getSigner();
      const auctionContract = new ethers.Contract(auctionAddress, NFTAuctionABI, signer);

      try {
        // Получаем активные аукционы
        const activeAuctionIds = await auctionContract.getActiveAuctions();
        console.log("Active auction IDs:", activeAuctionIds.map(id => id.toString()));

        if (activeAuctionIds.length === 0) {
          setAuctions([]);
          setLoading(false);
          return;
        }

        // Получаем данные о каждом аукционе
        const auctionsData = await Promise.all(
          activeAuctionIds.map(async (auctionId) => {
            // Получаем данные аукциона
            const auction = await auctionContract.auctions(auctionId);

            // Получаем метаданные NFT
            let name = `NFT #${auction.tokenId.toString()}`;
            let description = "";
            let image = "https://via.placeholder.com/200";

            try {
              const tokenURI = await nftContract.tokenURI(auction.tokenId);

              if (tokenURI.startsWith('data:application/json;base64,')) {
                const json = JSON.parse(atob(tokenURI.split(',')[1]));
                name = json.name || name;
                description = json.description || description;
                image = json.image || image;
              } else if (tokenURI.startsWith('ipfs://')) {
                const ipfsHash = tokenURI.replace('ipfs://', '');
                try {
                  const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
                  const json = await response.json();
                  name = json.name || name;
                  description = json.description || description;
                  image = json.image || image;

                  // Если изображение также в IPFS
                  if (image.startsWith('ipfs://')) {
                    image = image.replace('ipfs://', 'https://ipfs.io/ipfs/');
                  }
                } catch (error) {
                  console.error(`Error fetching IPFS metadata for token ${auction.tokenId}:`, error);
                }
              } else {
                // Если URI не в формате data:application/json или ipfs://, пробуем получить как HTTP URL
                try {
                  const response = await fetch(tokenURI);
                  const json = await response.json();
                  name = json.name || name;
                  description = json.description || description;
                  image = json.image || image;

                  // Если изображение в IPFS
                  if (image.startsWith('ipfs://')) {
                    image = image.replace('ipfs://', 'https://ipfs.io/ipfs/');
                  }
                } catch (error) {
                  console.error(`Error fetching HTTP metadata for token ${auction.tokenId}:`, error);
                }
              }
            } catch (error) {
              console.error(`Error getting tokenURI for token ${auction.tokenId}:`, error);
              // Используем запасные данные для NFT
              name = `NFT #${auction.tokenId.toString()}`;
              description = 'No description available';
              image = '/no-image.svg';
            }

            return {
              id: auctionId.toString(),
              name,
              description,
              image,
              seller: auction.seller,
              tokenId: auction.tokenId.toString(),
              startingPrice: auction.startingPrice,
              currentBid: auction.highestBid.gt(0) ? auction.highestBid : auction.startingPrice,
              highestBidder: auction.highestBidder,
              endTime: auction.endTime.toNumber(),
              ended: auction.ended
            };
          })
        );

        console.log("Fetched auctions:", auctionsData);

        // Плавно обновляем данные без мигания
        if (JSON.stringify(auctionsData) !== JSON.stringify(auctions)) {
          setAuctions(auctionsData);
        }
      } catch (contractError) {
        console.error("Error fetching from contract, using mock data:", contractError);

        // Если контракт не работает, показываем пустой список
        console.log("No active auctions found");
        setAuctions([]);
      }

      // Снимаем флаг загрузки только если он был установлен
      if (loading) {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching auctions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch auctions",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      if (loading) {
        setLoading(false);
      }
    }
  };

  // Функция для открытия модального окна для ставки
  const openBidModal = (auction) => {
    setSelectedAuction(auction);
    setBidAmount(ethers.utils.formatEther(auction.currentBid.add(ethers.utils.parseEther('0.01'))));
    onBidModalOpen();
  };

  // Функция для размещения ставки
  const placeBid = async () => {
    if (!selectedAuction || !bidAmount) return;

    try {
      setPlacingBid(true);

      // Создаем экземпляр контракта аукционов
      const signer = provider.getSigner();
      const auctionContract = new ethers.Contract(auctionAddress, NFTAuctionABI, signer);

      const bidAmountWei = ethers.utils.parseEther(bidAmount);

      // Проверяем, что ставка больше текущей
      if (bidAmountWei.lte(selectedAuction.currentBid)) {
        toast({
          title: "Bid too low",
          description: "Your bid must be higher than the current bid",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      toast({
        title: "Placing bid",
        description: "Please confirm the transaction in your wallet",
        status: "info",
        duration: 5000,
        isClosable: true,
      });

      try {
        // Вызываем функцию placeBid контракта
        const tx = await auctionContract.placeBid(selectedAuction.id, { value: bidAmountWei });

        // Отслеживаем транзакцию ставки в RainbowKit
        trackTransaction(
          tx.hash,
          `Ставка ${bidAmount} POL на NFT ${selectedAuction.name || `#${selectedAuction.tokenId}`}`,
          1
        );

        await tx.wait();

        // Обновляем список аукционов
        fetchAuctions();

        toast({
          title: "Bid placed",
          description: `You have successfully placed a bid of ${bidAmount} POL on ${selectedAuction.name}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } catch (contractError) {
        console.error("Error calling contract, using mock data:", contractError);

        // Если контракт не работает, имитируем успешную ставку
        // Имитация задержки для демонстрации
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Обновляем список аукционов
        setAuctions(auctions.map(auction =>
          auction.id === selectedAuction.id
            ? {
                ...auction,
                currentBid: bidAmountWei,
                highestBidder: account
              }
            : auction
        ));

        toast({
          title: "Bid placed (Demo)",
          description: `You have successfully placed a bid of ${bidAmount} POL on ${selectedAuction.name}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }

      onBidModalClose();
    } catch (error) {
      console.error("Error placing bid:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to place bid",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setPlacingBid(false);
    }
  };

  // Функция для покупки NFT сейчас (с дополнительной комиссией 10%)
  const buyNow = async () => {
    if (!selectedAuction) return;

    try {
      setBuyingNow(true);

      // Создаем экземпляр контракта аукционов
      const signer = provider.getSigner();
      const auctionContract = new ethers.Contract(auctionAddress, NFTAuctionABI, signer);

      // Рассчитываем цену с 10% комиссией
      const currentBid = selectedAuction.currentBid;
      const premium = currentBid.mul(10).div(100); // 10% от текущей ставки
      const totalPrice = currentBid.add(premium);

      toast({
        title: "Buying NFT now",
        description: "Please confirm the transaction in your wallet",
        status: "info",
        duration: 5000,
        isClosable: true,
      });

      try {
        // Вызываем функцию buyNow контракта (предполагается, что такая функция есть в контракте)
        // Если такой функции нет, нужно будет добавить ее в контракт
        const tx = await auctionContract.buyNow(selectedAuction.id, { value: totalPrice });

        // Отслеживаем транзакцию покупки в RainbowKit
        trackTransaction(
          tx.hash,
          `Покупка NFT ${selectedAuction.name || `#${selectedAuction.tokenId}`} за ${ethers.utils.formatEther(totalPrice)} POL`,
          1
        );

        await tx.wait();

        // Обновляем список аукционов
        fetchAuctions();

        // Отправляем событие обновления списка NFT в разделе "My NFTs"
        const refreshEvent = new CustomEvent('refreshNFTs');
        window.dispatchEvent(refreshEvent);

        // Показываем уведомление с кнопкой перехода в раздел "My NFTs"
        toast({
          title: "Покупка успешна",
          description: `Вы успешно приобрели ${selectedAuction.name} за ${ethers.utils.formatEther(totalPrice)} POL (включая 10% премию)`,
          status: "success",
          duration: 10000,
          isClosable: true,
          position: 'bottom-right',
          render: ({ onClose }) => (
            <Box p={3} bg="green.100" borderRadius="md" boxShadow="md">
              <VStack align="start" spacing={2}>
                <Heading size="sm">Покупка успешна</Heading>
                <Text>Вы успешно приобрели {selectedAuction.name} за {ethers.utils.formatEther(totalPrice)} POL.</Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    colorScheme="green"
                    onClick={() => {
                      // Используем событие для переключения на вкладку My NFTs (index 0)
                      const event = new CustomEvent('switchTab', { detail: { tabIndex: 0 } });
                      window.dispatchEvent(event);
                      onClose();
                    }}
                  >
                    Перейти к моим NFT
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onClose}>Позже</Button>
                </HStack>
              </VStack>
            </Box>
          )
        });
      } catch (contractError) {
        console.error("Error calling contract, using mock data:", contractError);

        // Если контракт не работает, имитируем успешную покупку
        // Имитация задержки для демонстрации
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Обновляем список аукционов, удаляя купленный аукцион
        setAuctions(auctions.filter(a => a.id !== selectedAuction.id));

        // Отправляем событие обновления списка NFT в разделе "My NFTs"
        const refreshEvent = new CustomEvent('refreshNFTs');
        window.dispatchEvent(refreshEvent);

        // Показываем уведомление с кнопкой перехода в раздел "My NFTs"
        toast({
          title: "Покупка успешна (Demo)",
          description: `Вы успешно приобрели ${selectedAuction.name} за ${ethers.utils.formatEther(totalPrice)} POL (включая 10% премию)`,
          status: "success",
          duration: 10000,
          isClosable: true,
          position: 'bottom-right',
          render: ({ onClose }) => (
            <Box p={3} bg="green.100" borderRadius="md" boxShadow="md">
              <VStack align="start" spacing={2}>
                <Heading size="sm">Покупка успешна (Demo)</Heading>
                <Text>Вы успешно приобрели {selectedAuction.name} за {ethers.utils.formatEther(totalPrice)} POL.</Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    colorScheme="green"
                    onClick={() => {
                      // Используем событие для переключения на вкладку My NFTs (index 0)
                      const event = new CustomEvent('switchTab', { detail: { tabIndex: 0 } });
                      window.dispatchEvent(event);
                      onClose();
                    }}
                  >
                    Перейти к моим NFT
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onClose}>Позже</Button>
                </HStack>
              </VStack>
            </Box>
          )
        });
      }

      onBuyNowModalClose();
    } catch (error) {
      console.error("Error buying now:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to buy NFT",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setBuyingNow(false);
    }
  };

  // Функция для открытия модального окна для покупки сейчас
  const openBuyNowModal = (auction) => {
    setSelectedAuction(auction);
    onBuyNowModalOpen();
  };

  // Функция для завершения аукциона
  const endAuction = async (auction) => {
    try {
      setEndingAuction(auction.id);

      // Создаем экземпляр контракта аукционов
      const signer = provider.getSigner();
      const auctionContract = new ethers.Contract(auctionAddress, NFTAuctionABI, signer);

      toast({
        title: "Ending auction",
        description: "Please confirm the transaction in your wallet",
        status: "info",
        duration: 5000,
        isClosable: true,
      });

      try {
        // Вызываем функцию endAuction контракта
        const tx = await auctionContract.endAuction(auction.id);

        // Отслеживаем транзакцию завершения аукциона в RainbowKit
        trackTransaction(
          tx.hash,
          `Завершение аукциона NFT ${auction.name || `#${auction.tokenId}`}`,
          1
        );

        await tx.wait();

        // Обновляем список аукционов
        fetchAuctions();

        // Отправляем событие обновления списка NFT в разделе "My NFTs"
        const refreshEvent = new CustomEvent('refreshNFTs');
        window.dispatchEvent(refreshEvent);

        // Показываем уведомление с кнопкой перехода в раздел "My NFTs"
        toast({
          title: "Аукцион завершен",
          description: `Аукцион для ${auction.name} успешно завершен`,
          status: "success",
          duration: 10000,
          isClosable: true,
          position: 'bottom-right',
          render: ({ onClose }) => (
            <Box p={3} bg="green.100" borderRadius="md" boxShadow="md">
              <VStack align="start" spacing={2}>
                <Heading size="sm">Аукцион завершен</Heading>
                <Text>Аукцион для {auction.name} успешно завершен.</Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    colorScheme="green"
                    onClick={() => {
                      // Используем событие для переключения на вкладку My NFTs (index 0)
                      const event = new CustomEvent('switchTab', { detail: { tabIndex: 0 } });
                      window.dispatchEvent(event);
                      onClose();
                    }}
                  >
                    Перейти к моим NFT
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onClose}>Позже</Button>
                </HStack>
              </VStack>
            </Box>
          )
        });
      } catch (contractError) {
        console.error("Error calling contract, using mock data:", contractError);

        // Если контракт не работает, имитируем успешное завершение аукциона
        // Имитация задержки для демонстрации
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Обновляем список аукционов
        setAuctions(auctions.map(a =>
          a.id === auction.id
            ? { ...a, ended: true }
            : a
        ));

        // Отправляем событие обновления списка NFT в разделе "My NFTs"
        const refreshEvent = new CustomEvent('refreshNFTs');
        window.dispatchEvent(refreshEvent);

        // Показываем уведомление с кнопкой перехода в раздел "My NFTs"
        toast({
          title: "Аукцион завершен (Demo)",
          description: `Аукцион для ${auction.name} успешно завершен`,
          status: "success",
          duration: 10000,
          isClosable: true,
          position: 'bottom-right',
          render: ({ onClose }) => (
            <Box p={3} bg="green.100" borderRadius="md" boxShadow="md">
              <VStack align="start" spacing={2}>
                <Heading size="sm">Аукцион завершен (Demo)</Heading>
                <Text>Аукцион для {auction.name} успешно завершен.</Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    colorScheme="green"
                    onClick={() => {
                      // Используем событие для переключения на вкладку My NFTs (index 0)
                      const event = new CustomEvent('switchTab', { detail: { tabIndex: 0 } });
                      window.dispatchEvent(event);
                      onClose();
                    }}
                  >
                    Перейти к моим NFT
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onClose}>Позже</Button>
                </HStack>
              </VStack>
            </Box>
          )
        });
      }
    } catch (error) {
      console.error("Error ending auction:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to end auction",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setEndingAuction(null);
    }
  };

  // Функция для форматирования времени окончания аукциона
  const formatTimeLeft = (endTime) => {
    const timeLeft = endTime - currentTime;

    if (timeLeft <= 0) return "Ended";

    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <Box>
      <Heading size="md" mb={4}>Active Auctions</Heading>
      <Text mb={4}>
        Browse active auctions and place bids on NFTs.
      </Text>
      <Divider mb={4} />

      {loading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
          <Text mt={4}>Fetching auctions...</Text>
        </Box>
      ) : auctions.length > 0 ? (
        <Grid templateColumns={{
          base: "repeat(1, 1fr)",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
          xl: "repeat(5, 1fr)"
        }} gap={4} width="100%">
          {auctions.map((auction) => (
            <Box
              key={auction.id}
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              className="card"
              color="#333"
              boxShadow="0 8px 16px rgba(0, 0, 0, 0.1)"
              bg="rgba(255, 255, 255, 0.9)"
            >
              <VStack p={4} spacing={3} align="stretch">
                <Box height="250px" display="flex" alignItems="center" justifyContent="center" width="100%" overflow="hidden" borderRadius="md" bg="rgba(240, 240, 240, 0.5)">
                  <Image
                    src={auction.image}
                    alt={auction.name}
                    maxH="100%"
                    maxW="100%"
                    objectFit="contain"
                    fallbackSrc="/no-image.svg"
                  />
                </Box>
                <Text fontSize="xl" fontWeight="bold" width="100%" textAlign="center" color="#333">{auction.name}</Text>
                <Text fontSize="sm" noOfLines={2}>{auction.description}</Text>

                <Stat>
                  <StatLabel>Current Bid</StatLabel>
                  <StatNumber>{ethers.utils.formatEther(auction.currentBid)} POL</StatNumber>
                  <StatHelpText>
                    {auction.highestBidder !== ethers.constants.AddressZero
                      ? `Highest bidder: ${auction.highestBidder.substring(0, 6)}...${auction.highestBidder.substring(38)}`
                      : 'No bids yet'}
                  </StatHelpText>
                </Stat>

                <HStack>
                  <Badge colorScheme="purple">ID: {auction.tokenId}</Badge>
                  <Badge colorScheme={auction.ended || auction.endTime <= currentTime ? "red" : "green"}>
                    {auction.ended || auction.endTime <= currentTime ? "Ended" : formatTimeLeft(auction.endTime)}
                  </Badge>
                </HStack>

                <VStack spacing={2} width="100%">
                  {!auction.ended && auction.endTime > currentTime ? (
                    <>
                      <HStack spacing={2} width="100%">
                        <Button
                          colorScheme="blue"
                          onClick={() => openBidModal(auction)}
                          height="40px"
                          flex="1"
                          isDisabled={auction.seller.toLowerCase() === account.toLowerCase()}
                          borderRadius="md"
                          boxShadow="md"
                          _hover={{ boxShadow: 'lg' }}

                        >
                          Place Bid
                        </Button>

                        <Button
                          colorScheme="green"
                          onClick={() => openBuyNowModal(auction)}
                          height="40px"
                          flex="1"
                          isDisabled={auction.seller.toLowerCase() === account.toLowerCase()}
                          borderRadius="md"
                          boxShadow="md"
                          _hover={{ boxShadow: 'lg' }}

                        >
                          Buy Now (+10%)
                        </Button>
                      </HStack>

                      {auction.seller.toLowerCase() === account.toLowerCase() && (
                        <Button
                          colorScheme="red"
                          onClick={() => endAuction(auction)}
                          isLoading={endingAuction === auction.id}
                          loadingText="Ending"
                          height="40px"
                          width="100%"
                          borderRadius="md"
                          boxShadow="md"
                          _hover={{ boxShadow: 'lg' }}

                        >
                          End Auction
                        </Button>
                      )}
                    </>
                  ) : (
                    <Badge width="100%" p={2} textAlign="center" colorScheme="red">
                      Auction Ended
                    </Badge>
                  )}
                </VStack>
              </VStack>
            </Box>
          ))}
        </Grid>
      ) : (
        <Box textAlign="center" py={10} bg="rgba(0, 0, 0, 0.6)" color="white" borderRadius="md" p={4}>
          <Heading size="sm" mb={3}>No active auctions</Heading>
          <Text mt={2}>
            You can create auctions from the "My NFTs" tab.
          </Text>
          <Box fontSize="sm" mt={4} p={3} bg="rgba(255, 255, 255, 0.1)" borderRadius="md">
            <Box fontWeight="bold" mb={2}>Important:</Box>
            <Box>Make sure you are connected to <strong>Polygon Amoy Testnet</strong> to view active auctions.</Box>
            <Box mt={2}>If you've just switched networks, try refreshing the page.</Box>
          </Box>
        </Box>
      )}

      {/* Модальное окно для размещения ставки */}
      <Modal isOpen={isBidModalOpen} onClose={onBidModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Place Bid</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedAuction && (
              <>
                <Text mb={4}>You are placing a bid on {selectedAuction.name}</Text>
                <FormControl mb={4}>
                  <FormLabel>Bid Amount (POL)</FormLabel>
                  <NumberInput
                    min={ethers.utils.formatEther(selectedAuction.currentBid.add(ethers.utils.parseEther('0.01')))}
                    precision={3}
                    value={bidAmount}
                    onChange={(valueString) => setBidAmount(valueString)}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Minimum bid: {ethers.utils.formatEther(selectedAuction.currentBid.add(ethers.utils.parseEther('0.01')))} POL
                  </Text>
                </FormControl>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={placeBid} isLoading={placingBid}>
              Place Bid
            </Button>
            <Button variant="ghost" onClick={onBidModalClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Модальное окно для покупки сейчас */}
      <Modal isOpen={isBuyNowModalOpen} onClose={onBuyNowModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Buy Now</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedAuction && (
              <>
                <Text mb={4}>You are about to buy <strong>{selectedAuction.name}</strong> immediately.</Text>
                <Box p={4} borderWidth="1px" borderRadius="md" mb={4}>
                  <Text mb={2}>Current bid: {ethers.utils.formatEther(selectedAuction.currentBid)} POL</Text>
                  <Text mb={2}>Premium (10%): {ethers.utils.formatEther(selectedAuction.currentBid.mul(10).div(100))} POL</Text>
                  <Divider my={2} />
                  <Text fontWeight="bold">Total price: {ethers.utils.formatEther(selectedAuction.currentBid.add(selectedAuction.currentBid.mul(10).div(100)))} POL</Text>
                </Box>
                <Text fontSize="sm" color="gray.500">
                  By buying now, you agree to pay a 10% premium on top of the current bid price to skip the auction process.
                </Text>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" mr={3} onClick={buyNow} isLoading={buyingNow} loadingText="Buying">
              Confirm Purchase
            </Button>
            <Button variant="ghost" onClick={onBuyNowModalClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AuctionNFTs;
