import { useState } from 'react';
import { Box, Text, Button, VStack, HStack, Heading, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useDisclosure, FormControl, FormLabel, Input, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper } from '@chakra-ui/react';
import ShimmerButton from './ShimmerButton';
import { ethers } from 'ethers';
import { CONFIG } from '../config';

const StakingCard = ({ nft, stakingContract, nftContract, provider, onStakeSuccess, isMobile, isTablet, isLandscape }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isAuctioning, setIsAuctioning] = useState(false);
  const [price, setPrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState(24); // Default 24 hours

  const { isOpen: isAuctionModalOpen, onOpen: onAuctionModalOpen, onClose: onAuctionModalClose } = useDisclosure();

  const toast = useToast();

  // Адрес контракта аукциона из config
  const AUCTION_ADDRESS = CONFIG.AUCTION_ADDRESS;

  // Импортируем ABI для взаимодействия с контрактом аукционов
  const NFT_AUCTION_ABI = [
    "function createAuction(address _nftContract, uint256 _tokenId, uint256 _startingPrice, uint256 _duration) external",
    "function auctions(uint256) view returns (uint256 id, address seller, address nftContract, uint256 tokenId, uint256 startingPrice, uint256 endTime, address highestBidder, uint256 highestBid, bool ended)"
  ];

  const checkIfApproved = async (contractAddress) => {
    try {
      // Если не указан адрес контракта, проверяем одобрение для контракта стейкинга
      const targetAddress = contractAddress || await stakingContract.address;
      console.log("Checking approval for address:", targetAddress);

      // Используем isApprovedForAll вместо getApproved
      const signer = provider.getSigner();
      const signerAddress = await signer.getAddress();
      const isApprovedForAll = await nftContract.isApprovedForAll(signerAddress, targetAddress);
      console.log("Is approved for all:", isApprovedForAll);

      // Также проверяем одобрение для конкретного токена
      const approved = await nftContract.getApproved(nft.tokenId);
      console.log("Current approved address for token:", approved);

      return isApprovedForAll || approved.toLowerCase() === targetAddress.toLowerCase();
    } catch (error) {
      console.error("Error checking approval:", error);
      return false;
    }
  };

  const approveNFT = async (contractAddress) => {
    try {
      setIsApproving(true);
      // Если не указан адрес контракта, используем адрес контракта стейкинга
      const targetAddress = contractAddress || await stakingContract.address;
      console.log("Approving NFT for address:", targetAddress);

      toast({
        title: 'Approving NFT',
        description: 'Please confirm the transaction in your wallet',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      // Используем setApprovalForAll вместо approve
      const tx = await nftContract.setApprovalForAll(targetAddress, true);
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
    } finally {
      setIsApproving(false);
    }
  };

  const stakeNFT = async () => {
    try {
      setIsLoading(true);

      // Check if NFT is approved for staking contract
      const stakingAddress = await stakingContract.address;
      const isApproved = await checkIfApproved(stakingAddress);
      if (!isApproved) {
        const approved = await approveNFT(stakingAddress);
        if (!approved) return;
      }

      toast({
        title: 'Staking NFT',
        description: 'Please confirm the transaction in your wallet',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      const tx = await stakingContract.stake(nft.tokenId);
      await tx.wait();

      // Отправляем событие обновления списка стейкнутых NFT
      const refreshEvent = new CustomEvent('refreshStakedNFTs');
      window.dispatchEvent(refreshEvent);

      // Показываем уведомление с кнопкой перехода в раздел "Staked NFTs"
      toast({
        title: 'NFT Staked',
        description: 'Your NFT has been successfully staked!',
        status: 'success',
        duration: 10000,
        isClosable: true,
        position: 'bottom-right',
        render: ({ onClose }) => (
          <Box p={3} bg="green.100" borderRadius="md" boxShadow="md">
            <VStack align="start" spacing={2}>
              <Heading size="sm">NFT Staked</Heading>
              <Text>Your NFT has been successfully staked!</Text>
              <HStack spacing={2}>
                <ShimmerButton
                  size="sm"
                  colorScheme="green"
                  onClick={() => {
                    // Используем событие для переключения на вкладку Staked NFTs (index 1)
                    const event = new CustomEvent('switchTab', { detail: { tabIndex: 1 } });
                    window.dispatchEvent(event);
                    onClose();
                  }}
                >
                  Перейти к стейкнутым NFT
                </ShimmerButton>
                <Button size="sm" variant="ghost" onClick={onClose}>Позже</Button>
              </HStack>
            </VStack>
          </Box>
        )
      });

      if (onStakeSuccess) {
        onStakeSuccess();
      }
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
      setIsLoading(false);
    }
  };



  const createAuction = async () => {
    try {
      setIsAuctioning(true);

      // Получаем адрес подписчика
      const signer = provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log('Signer address:', signerAddress);
      console.log('Auction contract address:', AUCTION_ADDRESS);
      console.log('NFT contract address:', nftContract.address);
      console.log('Token ID:', nft.tokenId);

      // Проверяем, одобрен ли NFT для контракта аукционов
      const isApprovedForAll = await nftContract.isApprovedForAll(signerAddress, AUCTION_ADDRESS);
      console.log('Is approved for all:', isApprovedForAll);

      // Также проверяем одобрение для конкретного токена
      const approvedAddress = await nftContract.getApproved(nft.tokenId);
      console.log('Approved address for token:', approvedAddress);

      // Если NFT не одобрен, одобряем его
      if (!isApprovedForAll && approvedAddress.toLowerCase() !== AUCTION_ADDRESS.toLowerCase()) {
        toast({
          title: 'Approving NFT',
          description: 'Please confirm the transaction in your wallet',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });

        console.log('Approving NFT for auction contract...');
        // Сначала пробуем одобрить конкретный токен
        try {
          const approveTx = await nftContract.approve(AUCTION_ADDRESS, nft.tokenId, { gasLimit: 500000 });
          await approveTx.wait();
          console.log('NFT approved successfully!');
        } catch (approveError) {
          console.error('Error approving specific token:', approveError);

          // Если не удалось одобрить конкретный токен, пробуем одобрить все токены
          console.log('Trying to approve all tokens...');
          const approveAllTx = await nftContract.setApprovalForAll(AUCTION_ADDRESS, true, { gasLimit: 500000 });
          await approveAllTx.wait();
          console.log('All NFTs approved successfully!');
        }

        // Проверяем, что одобрение прошло успешно
        const isApprovedAfter = await nftContract.isApprovedForAll(signerAddress, AUCTION_ADDRESS);
        const approvedAddressAfter = await nftContract.getApproved(nft.tokenId);
        console.log('Is approved for all after:', isApprovedAfter);
        console.log('Approved address for token after:', approvedAddressAfter);

        if (!isApprovedAfter && approvedAddressAfter.toLowerCase() !== AUCTION_ADDRESS.toLowerCase()) {
          throw new Error('Failed to approve NFT for auction contract');
        }

        toast({
          title: 'NFT Approved',
          description: 'Your NFT is now approved for the auction contract',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      toast({
        title: 'Creating Auction',
        description: 'Please confirm the transaction in your wallet',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      // Создаем экземпляр контракта аукционов
      const auctionContract = new ethers.Contract(AUCTION_ADDRESS, NFT_AUCTION_ABI, signer);

      // Проверяем, что цена не пустая
      if (!price || price === '') {
        throw new Error('Price cannot be empty');
      }

      // Преобразуем цену в wei
      const priceInWei = ethers.utils.parseEther(price);

      // Преобразуем длительность в секунды
      const durationInSeconds = auctionDuration * 3600; // часы в секунды

      console.log('Creating auction with parameters:');
      console.log('- NFT Contract:', nftContract.address);
      console.log('- Token ID:', nft.tokenId);
      console.log('- Starting Price:', priceInWei.toString());
      console.log('- Duration:', durationInSeconds);

      // Вызываем функцию createAuction контракта с увеличенным лимитом газа
      const tx = await auctionContract.createAuction(
        nftContract.address,
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
        description: `Auction for ${nft.name} has been created with starting price ${price} POL and duration ${auctionDuration} hours`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onAuctionModalClose();
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
    }
  };

  // Установка значения isMobile по умолчанию, если оно не передано
  const mobileCheck = isMobile !== undefined ? isMobile : window.innerWidth <= 576;

  return (
    <Box borderWidth="1px" borderRadius="lg" p={mobileCheck ? 2 : 4} className="card" color="#333" style={{ animation: 'none' }} width="100%" boxShadow="0 8px 16px rgba(0, 0, 0, 0.1)" bg="rgba(0, 0, 0, 0.82)" minHeight={mobileCheck ? "350px" : "400px"} display="flex" flexDirection="column" maxWidth="100%">
      <VStack spacing={mobileCheck ? 2 : 4} width="100%" flex="1">
        <Box height={mobileCheck ? "150px" : "180px"} display="flex" alignItems="center" justifyContent="center" width="100%" overflow="hidden" borderRadius="md" bg="rgba(240, 240, 240, 0.5)">
          <img src={nft.image} alt={nft.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
        </Box>
        <Text fontSize={mobileCheck ? "sm" : "md"} fontWeight="bold" width="100%" textAlign="center" color="#333" noOfLines={1} overflow="hidden" textOverflow="ellipsis">{nft.name}</Text>

        <Box width="100%" px={2}>
          <Text fontSize="xs" color="#4A5568" mb={1}>
            <Text as="span" fontWeight="bold">ID: </Text>
            <Text as="span">{nft.tokenId}</Text>
          </Text>

          <Text fontSize="xs" color="#4A5568" mb={1} noOfLines={2}>
            <Text as="span" fontWeight="bold">Description: </Text>
            <Text as="span">{nft.description || 'No description'}</Text>
          </Text>

          {nft.contractAddress && (
            <Text fontSize="xs" color="#4A5568" mb={1} noOfLines={1}>
              <Text as="span" fontWeight="bold">Contract: </Text>
              <Text as="span">{`${nft.contractAddress.substring(0, 6)}...${nft.contractAddress.substring(nft.contractAddress.length - 4)}`}</Text>
            </Text>
          )}
        </Box>

        <VStack spacing={mobileCheck ? 2 : 3} width="full">
          <ShimmerButton
            colorScheme="green"
            onClick={stakeNFT}
            isLoading={isLoading || isApproving}
            loadingText={isApproving ? "Approving" : "Staking"}
            width="full"
            height={mobileCheck ? "36px" : "40px"}
            fontSize={mobileCheck ? "xs" : "sm"}
            borderRadius="md"
            boxShadow="md"
            _hover={{ boxShadow: 'lg' }}
          >
            Stake NFT
          </ShimmerButton>

          <ShimmerButton
            colorScheme="orange"
            onClick={() => {
              setPrice('0.1');
              setAuctionDuration('24');
              onAuctionModalOpen();
            }}
            width="full"
            height={mobileCheck ? "36px" : "40px"}
            fontSize={mobileCheck ? "xs" : "sm"}
            borderRadius="md"
            boxShadow="md"
            _hover={{ boxShadow: 'lg' }}
          >
            Auction
          </ShimmerButton>
        </VStack>



        {/* Модальное окно для создания аукциона */}
        <Modal isOpen={isAuctionModalOpen} onClose={onAuctionModalClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create Auction</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text mb={4}>Set auction parameters for {nft.name}</Text>
              <FormControl mb={4}>
                <FormLabel>Starting Price (POL)</FormLabel>
                <NumberInput defaultValue={0.1} min={0.001} precision={3} value={price || '0.1'} onChange={(valueString) => setPrice(valueString)}>
                  <NumberInputField
                    placeholder="Enter starting price in POL"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Duration (hours)</FormLabel>
                <NumberInput defaultValue={24} min={1} max={168} value={auctionDuration || 24} onChange={(valueString) => setAuctionDuration(valueString)}>
                  <NumberInputField
                    placeholder="Enter auction duration in hours"
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <ShimmerButton colorScheme="orange" mr={3} onClick={createAuction} isLoading={isAuctioning} borderRadius="md" boxShadow="md">
                Create Auction
              </ShimmerButton>
              <Button variant="ghost" onClick={onAuctionModalClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default StakingCard;