import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  useToast
} from '@chakra-ui/react';
import ShimmerButton from './ShimmerButton';
import { ethers } from 'ethers';

const StakedNFTs = ({ stakingContract, nftContract, account }) => {
  const [stakedNFTs, setStakedNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRewards, setTotalRewards] = useState('0');
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const toast = useToast();

  useEffect(() => {
    if (stakingContract && account) {
      fetchStakedNFTs();

      // Set up interval to refresh rewards - увеличиваем интервал до 15 секунд
      const interval = setInterval(() => {
        setRefreshCounter(prev => prev + 1);
      }, 15000);

      // Прослушиваем событие обновления списка стейкнутых NFT
      const handleRefreshStakedNFTs = () => {
        console.log('Refreshing Staked NFTs from event in StakedNFTs component');
        fetchStakedNFTs();
      };

      window.addEventListener('refreshStakedNFTs', handleRefreshStakedNFTs);

      return () => {
        clearInterval(interval);
        window.removeEventListener('refreshStakedNFTs', handleRefreshStakedNFTs);
      };
    }
  }, [stakingContract, account]);

  useEffect(() => {
    if (stakingContract && stakedNFTs.length > 0 && refreshCounter > 0) {
      updateRewards();
    }
  }, [refreshCounter]);

  // Обновление времени каждую секунду для отображения в реальном времени
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
      updateStakedTime();
    }, 1000);

    return () => clearInterval(timer);
  }, [stakedNFTs]);

  const fetchStakedNFTs = async () => {
    try {
      setLoading(true);

      // Get staked NFT IDs
      const tokenIds = await stakingContract.getStakedNFTs(account);

      if (tokenIds.length === 0) {
        setStakedNFTs([]);
        setLoading(false);
        return;
      }

      // Get total rewards
      const rewards = await stakingContract.getTotalRewards(account);
      setTotalRewards(ethers.utils.formatEther(rewards));

      // Get details for each staked NFT
      const nftsWithDetails = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const [owner, timestamp, rewards] = await stakingContract.getStakingInfo(tokenId);

          // Get NFT metadata
          let name = `NFT #${tokenId.toString()}`;
          let image = 'https://via.placeholder.com/200';

          try {
            const tokenURI = await nftContract.tokenURI(tokenId);
            if (tokenURI.startsWith('data:application/json;base64,')) {
              const json = JSON.parse(atob(tokenURI.split(',')[1]));
              name = json.name || name;
              image = json.image || image;
            }
          } catch (error) {
            console.error(`Error fetching metadata for token ${tokenId}:`, error);
          }

          const stakedTime = Math.floor((Date.now() / 1000) - timestamp);
          const hours = Math.floor(stakedTime / 3600);
          const minutes = Math.floor((stakedTime % 3600) / 60);
          const seconds = stakedTime % 60;

          return {
            tokenId: tokenId.toString(),
            owner,
            timestamp: timestamp.toString(),
            rewards: ethers.utils.formatEther(rewards),
            name,
            image,
            stakedTime: `${hours}h ${minutes}m ${seconds}s`,
            progress: (stakedTime % 3600) / 3600 * 100
          };
        })
      );

      setStakedNFTs(nftsWithDetails);
    } catch (error) {
      console.error('Error fetching staked NFTs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch staked NFTs',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Функция для обновления времени стейкинга в реальном времени
  const updateStakedTime = () => {
    if (stakedNFTs.length === 0) return;

    const updatedNFTs = stakedNFTs.map(nft => {
      const stakedTime = Math.floor((Date.now() / 1000) - nft.timestamp);
      const hours = Math.floor(stakedTime / 3600);
      const minutes = Math.floor((stakedTime % 3600) / 60);
      const seconds = stakedTime % 60;

      return {
        ...nft,
        stakedTime: `${hours}h ${minutes}m ${seconds}s`,
        progress: (stakedTime % 3600) / 3600 * 100
      };
    });

    setStakedNFTs(updatedNFTs);
  };

  const updateRewards = async () => {
    try {
      // Сначала проверяем, какие NFT все еще в стейкинге
      const tokenIds = await stakingContract.getStakedNFTs(account);
      const validTokenIds = new Set(tokenIds.map(id => id.toString()));

      // Обновляем только те NFT, которые все еще в стейкинге
      const updatedNFTs = await Promise.all(
        stakedNFTs.map(async (nft) => {
          // Если NFT больше не в стейкинге, не запрашиваем награды
          if (!validTokenIds.has(nft.tokenId)) {
            return nft; // Возвращаем без изменений
          }

          try {
            const realTimeRewards = await stakingContract.calculateRealTimeRewards(nft.tokenId);

            const stakedTime = Math.floor((Date.now() / 1000) - nft.timestamp);
            const hours = Math.floor(stakedTime / 3600);
            const minutes = Math.floor((stakedTime % 3600) / 60);
            const seconds = stakedTime % 60;

            return {
              ...nft,
              rewards: ethers.utils.formatEther(realTimeRewards),
              stakedTime: `${hours}h ${minutes}m ${seconds}s`,
              progress: (stakedTime % 3600) / 3600 * 100
            };
          } catch (nftError) {
            // Если ошибка "Not staked", значит NFT уже не в стейкинге
            if (nftError.reason === "Not staked") {
              return nft; // Возвращаем без изменений
            }

            console.warn(`Error calculating rewards for NFT ${nft.tokenId}:`, nftError);
            // Возвращаем NFT без обновления наград в случае ошибки
            return {
              ...nft,
              rewards: nft.rewards || '0',
              stakedTime: nft.stakedTime || '0h 0m 0s',
              progress: nft.progress || 0
            };
          }
        })
      );

      // Обновляем только если массив не пустой
      if (updatedNFTs.length > 0) {
        setStakedNFTs(updatedNFTs);
      }

      try {
        // Update total rewards только если есть NFT в стейкинге
        if (tokenIds.length > 0) {
          const rewards = await stakingContract.getTotalRewards(account);
          setTotalRewards(ethers.utils.formatEther(rewards));
        }
      } catch (rewardsError) {
        console.warn('Error getting total rewards:', rewardsError);
        // Не обновляем общую сумму наград в случае ошибки
      }
    } catch (error) {
      console.error('Error updating rewards:', error);
      // Не показываем toast с ошибкой, чтобы не раздражать пользователя
      // при периодическом обновлении наград
    }
  };

  const handleUnstake = async (tokenId) => {
    try {
      toast({
        title: 'Processing',
        description: 'Unstaking your NFT...',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });

      // Получаем экземпляр контракта NFT
      const nftContractAddress = await stakingContract.nftCollection();
      console.log('NFT Contract Address:', nftContractAddress);

      // Проверяем, одобрен ли контракт стейкинга для передачи NFT
      const isApproved = await nftContract.isApprovedForAll(account, stakingContract.address);
      console.log('Is Staking Contract approved for all NFTs:', isApproved);

      if (!isApproved) {
        console.log('Approving Staking Contract for all NFTs...');
        const approveTx = await nftContract.setApprovalForAll(stakingContract.address, true, { gasLimit: 500000 });
        await approveTx.wait();
        console.log('Staking Contract approved for all NFTs');
      }

      // Вызываем функцию unstake
      console.log('Calling unstake function with tokenId:', tokenId);
      const tx = await stakingContract.unstake(tokenId, { gasLimit: 500000 });
      console.log('Unstake transaction hash:', tx.hash);

      await tx.wait();
      console.log('Unstake transaction confirmed');

      // Отправляем событие обновления списка NFT в разделе "My NFTs"
      const refreshNFTsEvent = new CustomEvent('refreshNFTs');
      window.dispatchEvent(refreshNFTsEvent);

      // Показываем уведомление с кнопкой перехода в раздел "My NFTs"
      toast({
        title: 'Success',
        description: 'NFT unstaked and rewards claimed!',
        status: 'success',
        duration: 10000,
        isClosable: true,
        position: 'bottom-right',
        render: ({ onClose }) => (
          <Box p={3} bg="green.100" borderRadius="md" boxShadow="md">
            <VStack align="start" spacing={2}>
              <Heading size="sm">NFT Unstaked</Heading>
              <Text>Your NFT has been successfully unstaked and rewards claimed!</Text>
              <HStack spacing={2}>
                <ShimmerButton
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
                </ShimmerButton>
                <Button size="sm" variant="ghost" onClick={onClose}>Позже</Button>
              </HStack>
            </VStack>
          </Box>
        )
      });

      // Refresh staked NFTs
      fetchStakedNFTs();
    } catch (error) {
      console.error('Error unstaking NFT:', error);

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
        title: 'Error',
        description: 'Failed to unstake NFT: ' + errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="#4A5568">Loading staked NFTs...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <HStack justifyContent="space-between" mb={6}>
        <Heading size="md" color="#4A5568">Your Staked NFTs</Heading>
        <Stat textAlign="right" maxW="200px">
          <StatLabel color="#4A5568">Total Rewards</StatLabel>
          <StatNumber color="#4A5568">{parseFloat(totalRewards).toFixed(2)} ART</StatNumber>
          <StatHelpText>
            <Badge colorScheme="purple">{stakedNFTs.length} NFTs Staked</Badge>
          </StatHelpText>
        </Stat>
      </HStack>

      {stakedNFTs.length === 0 ? (
        <Box textAlign="center" py={10} bg="gray.50" borderRadius="md">
          <Text color="#4A5568">You don't have any staked NFTs yet.</Text>
        </Box>
      ) : (
        <Grid templateColumns={{
          base: "repeat(1, 1fr)",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
          xl: "repeat(5, 1fr)"
        }} gap={4} width="100%">
          {stakedNFTs.map((nft) => (
            <Box
              key={nft.tokenId}
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              className="card"
              color="#333"
              boxShadow="0 8px 16px rgba(0, 0, 0, 0.1)"
              bg="rgba(7, 7, 7, 0.86)"
              style={{ animation: 'none' }} // Отключаем анимацию для предотвращения мигания
            >
              <VStack p={5} spacing={4} align="stretch">
                <Box height="270px" display="flex" alignItems="center" justifyContent="center" width="100%" overflow="hidden" borderRadius="md" bg="rgba(240, 240, 240, 0.5)">
                  <img src={nft.image} alt={nft.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </Box>

                <Text fontSize="xl" fontWeight="bold" width="100%" textAlign="center" color="#4A5568">{nft.name}</Text>

                <Box>
                  <Text fontSize="md" mb={2} fontWeight="medium" color="#4A5568">Staking Progress</Text>
                  <Progress value={nft.progress} colorScheme="purple" hasStripe size="md" />
                </Box>

                <HStack justifyContent="space-between">
                  <Text fontSize="md" color="#4A5568">Time Staked:</Text>
                  <Text fontSize="md" fontWeight="bold" color="#4A5568">{nft.stakedTime}</Text>
                </HStack>

                <HStack justifyContent="space-between">
                  <Text fontSize="md" color="#4A5568">Rewards:</Text>
                  <Text fontSize="md" fontWeight="bold" color="#4A5568">{parseFloat(nft.rewards).toFixed(2)} ART</Text>
                </HStack>

                <ShimmerButton
                  colorScheme="red"
                  onClick={() => handleUnstake(nft.tokenId)}
                  borderRadius="md"
                  boxShadow="lg"
                  className="unstake-button"
                  height="50px"
                  fontSize="md"
                  width="full"
                  _hover={{ boxShadow: 'xl' }}

                >
                  Unstake & Claim
                </ShimmerButton>
              </VStack>
            </Box>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default StakedNFTs;
