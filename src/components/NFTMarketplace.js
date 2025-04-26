import { useState, useEffect } from 'react';
import { Grid, Box, Heading, Tabs, TabList, TabPanels, Tab, TabPanel, Divider, useToast, useMediaQuery, Text } from '@chakra-ui/react';
import { ethers } from 'ethers';
import StakingCard from './StakingCard';
import StakedNFTs from './StakedNFTs';
import MintNFT from './MintNFT';
import ImportNFT from './ImportNFT';
import MarketplaceNFTs from './MarketplaceNFTs';
import AuctionNFTs from './AuctionNFTs';
import AIAgent from './AIAgent';
import SimpleNetworkInfo from './SimpleNetworkInfo';

// Import ABIs
import NFTStakingABI from '../contracts/NFTStakingABI.json';
import MetaArtNFTABI from '../contracts/MetaArtNFTABI.json';
import ARTTokenABI from '../contracts/ARTTokenABI.json';

// Import config
import { CONFIG } from '../config';

const NFTMarketplace = ({ provider, account }) => {
  const [nfts, setNfts] = useState([]);
  const [stakingContract, setStakingContract] = useState(null);
  const [nftContract, setNftContract] = useState(null);
  const [artTokenContract, setArtTokenContract] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const toast = useToast();

  // Определяем размер экрана для адаптивного дизайна
  const [isMobile] = useMediaQuery("(max-width: 576px)");
  const [isTablet] = useMediaQuery("(min-width: 577px) and (max-width: 991px)");
  const [isLandscape] = useMediaQuery("(orientation: landscape) and (max-height: 500px)");
  const [isDesktop] = useMediaQuery("(min-width: 992px)");

  // Contract addresses from config
  const stakingAddress = CONFIG.STAKING_CONTRACT_ADDRESS;
  const nftAddress = CONFIG.NFT_CONTRACT_ADDRESS;
  const artTokenAddress = CONFIG.ART_TOKEN_ADDRESS;
  const auctionAddress = CONFIG.AUCTION_ADDRESS;

  // Log contract addresses for debugging
  console.log('Staking Contract Address:', stakingAddress);
  console.log('NFT Contract Address:', nftAddress);
  console.log('ART Token Address:', artTokenAddress);
  console.log('Auction Contract Address:', auctionAddress);

  useEffect(() => {
    const initializeContracts = async () => {
      if (provider && account) {
        try {
          // Initialize contracts with their ABIs
          const signer = provider.getSigner();

          const nftContractInstance = new ethers.Contract(nftAddress, MetaArtNFTABI, signer);
          setNftContract(nftContractInstance);

          const stakingContractInstance = new ethers.Contract(stakingAddress, NFTStakingABI, signer);
          setStakingContract(stakingContractInstance);

          const artTokenContractInstance = new ethers.Contract(artTokenAddress, ARTTokenABI, signer);
          setArtTokenContract(artTokenContractInstance);

          setIsLoading(false);
        } catch (error) {
          console.error("Error initializing contracts:", error);
          toast({
            title: "Contract Initialization Error",
            description: error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }
    };

    initializeContracts();
  }, [provider, account]);

  useEffect(() => {
    if (nftContract && stakingContract && account) {
      fetchUserNFTs();
    }
  }, [nftContract, stakingContract, account, refreshTrigger]);

  const fetchUserNFTs = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching NFTs for account:", account);
      console.log("NFT Contract address:", nftAddress);

      let tokenIds = [];
      let hasTokensOfOwner = false;

      // Проверяем, есть ли метод tokensOfOwner в контракте
      try {
        // Проверяем наличие метода в ABI
        hasTokensOfOwner = nftContract.interface.getFunction('tokensOfOwner') !== null;
        console.log("Contract has tokensOfOwner method:", hasTokensOfOwner);
      } catch (error) {
        console.log("Error checking tokensOfOwner method:", error.message);
        hasTokensOfOwner = false;
      }

      if (hasTokensOfOwner) {
        // Используем tokensOfOwner, если он доступен
        try {
          tokenIds = await nftContract.tokensOfOwner(account);
          console.log("TokenIds from tokensOfOwner:", tokenIds);
        } catch (error) {
          console.error("Error calling tokensOfOwner:", error);
          // Если метод вызвал ошибку, используем альтернативный подход
          hasTokensOfOwner = false;
        }
      }

      if (!hasTokensOfOwner) {
        // Альтернативный подход: используем balanceOf и tokenOfOwnerByIndex
        try {
          console.log("Using alternative approach with balanceOf and tokenOfOwnerByIndex");
          const balance = await nftContract.balanceOf(account);
          console.log("NFT balance:", balance.toString());

          // Получаем все токены пользователя
          for (let i = 0; i < balance; i++) {
            try {
              const tokenId = await nftContract.tokenOfOwnerByIndex(account, i);
              tokenIds.push(tokenId);
              console.log(`Found token ID: ${tokenId.toString()}`);
            } catch (error) {
              console.error(`Error getting token at index ${i}:`, error);
            }
          }
        } catch (error) {
          console.error("Error using alternative approach:", error);
          // Если и этот подход не сработал, показываем пустой список
          setNfts([]);
          setIsLoading(false);
          return;
        }
      }

      // Если токенов нет, показываем пустой список
      if (tokenIds.length === 0) {
        console.log("No tokens found, showing empty list");
        setNfts([]);
        setIsLoading(false);
        return;
      }

      try {
        // Get metadata for each NFT
        const nftsWithMetadata = await Promise.all(
          tokenIds.map(async (tokenId) => {
            let name = `NFT #${tokenId.toString()}`;
            let description = "";
            let image = "/no-image.svg";

            try {
              const tokenURI = await nftContract.tokenURI(tokenId);
              console.log(`Token URI for ${tokenId}:`, tokenURI);

              if (tokenURI.startsWith('data:application/json;base64,')) {
                const json = JSON.parse(atob(tokenURI.split(',')[1]));
                name = json.name || name;
                description = json.description || description;
                image = json.image || image;
              } else if (tokenURI.startsWith('ipfs://')) {
                // Обрабатываем IPFS URI
                const ipfsUrl = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
                try {
                  const response = await fetch(ipfsUrl);
                  const json = await response.json();
                  name = json.name || name;
                  description = json.description || description;
                  image = json.image || image;

                  // Преобразуем URL изображения, если необходимо
                  if (image.startsWith('ipfs://')) {
                    image = image.replace('ipfs://', 'https://ipfs.io/ipfs/');
                  }
                } catch (error) {
                  console.error(`Error fetching IPFS metadata for token ${tokenId}:`, error);
                }
              } else if (tokenURI.startsWith('http')) {
                // Обрабатываем HTTP URI
                try {
                  const response = await fetch(tokenURI);
                  const json = await response.json();
                  name = json.name || name;
                  description = json.description || description;
                  image = json.image || image;

                  // Преобразуем URL изображения, если необходимо
                  if (image.startsWith('ipfs://')) {
                    image = image.replace('ipfs://', 'https://ipfs.io/ipfs/');
                  }
                } catch (error) {
                  console.error(`Error fetching HTTP metadata for token ${tokenId}:`, error);
                }
              }
            } catch (error) {
              console.error(`Error fetching metadata for token ${tokenId}:`, error);
            }

            return {
              tokenId: tokenId.toString(),
              name,
              description,
              image
            };
          })
        );

        console.log("NFTs with metadata:", nftsWithMetadata);
        setNfts(nftsWithMetadata);
      } catch (error) {
        console.error("Error processing NFT metadata:", error);
        // Show empty list in case of error
        setNfts([]);
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      toast({
        title: "Error Fetching NFTs",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      // В случае ошибки показываем пустой список
      setNfts([]);
      setIsLoading(false);
    }
  };



  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Прослушиваем события переключения вкладки и обновления NFT
  useEffect(() => {
    // Добавляем дебаунсинг для предотвращения частых обновлений
    let refreshTimeout = null;

    const debouncedRefresh = () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      refreshTimeout = setTimeout(() => {
        handleRefresh();
      }, 1000); // Задержка 1 секунда
    };

    // Обработчик события переключения вкладки
    const handleSwitchTab = (event) => {
      if (event.detail && typeof event.detail.tabIndex === 'number') {
        setActiveTab(event.detail.tabIndex);
      }
    };

    // Обработчик события обновления списка NFT
    const handleRefreshNFTs = () => {
      console.log('Refreshing NFTs from event');
      debouncedRefresh();
    };

    // Обработчик события обновления списка стейкнутых NFT
    const handleRefreshStakedNFTs = () => {
      console.log('Refreshing Staked NFTs from event');
      debouncedRefresh();
    };

    // Добавляем обработчики событий
    window.addEventListener('switchTab', handleSwitchTab);
    window.addEventListener('refreshNFTs', handleRefreshNFTs);
    window.addEventListener('refreshStakedNFTs', handleRefreshStakedNFTs);

    // Удаляем обработчики при размонтировании
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      window.removeEventListener('switchTab', handleSwitchTab);
      window.removeEventListener('refreshNFTs', handleRefreshNFTs);
      window.removeEventListener('refreshStakedNFTs', handleRefreshStakedNFTs);
    };
  }, []);

  return (
    <Box p={0} className="responsive-container" width="100%" overflow="visible">
      <SimpleNetworkInfo />
      <Tabs
        isFitted
        variant="enclosed"
        index={activeTab}
        onChange={setActiveTab}
        colorScheme="purple"
        className="tabs-container responsive-tabs"
        isLazy={true}
        width="100%"
      >
        <TabList
          mb={4}
          overflowX="visible"
          overflowY="hidden"
          whiteSpace="nowrap"
          className="responsive-tabs sticky-tabs"
          bg="rgba(255, 255, 255, 0)"
          borderRadius="md"
          p={2}
          boxShadow="md"
          display="flex"
          width="100%"
          position="fixed"
          top="170px"
          left="0"
          right="0"
          zIndex="90"
          maxWidth="1400px"
          margin="0 auto"
        >
          <Tab
            fontSize={isMobile ? "xs" : isTablet ? "sm" : "md"}
            p={isMobile ? 2 : 4}
            fontWeight="bold"
            _selected={{ color: "purple.800", bg: "white", borderColor: "purple.200", boxShadow: "md", fontWeight: "bold" }}
            borderRadius="md"
            mx={1}
          >
            My NFTs
          </Tab>
          <Tab
            fontSize={isMobile ? "xs" : isTablet ? "sm" : "md"}
            p={isMobile ? 2 : 4}
            fontWeight="bold"
            _selected={{ color: "purple.800", bg: "white", borderColor: "purple.200", boxShadow: "md", fontWeight: "bold" }}
            borderRadius="md"
            mx={1}
          >
            Staked NFTs
          </Tab>
          <Tab
            fontSize={isMobile ? "xs" : isTablet ? "sm" : "md"}
            p={isMobile ? 2 : 4}
            fontWeight="bold"
            _selected={{ color: "purple.800", bg: "white", borderColor: "purple.200", boxShadow: "md", fontWeight: "bold" }}
            borderRadius="md"
            mx={1}
          >
            Auctions
          </Tab>
          <Tab
            fontSize={isMobile ? "xs" : isTablet ? "sm" : "md"}
            p={isMobile ? 2 : 4}
            fontWeight="bold"
            _selected={{ color: "purple.800", bg: "white", borderColor: "purple.200", boxShadow: "md", fontWeight: "bold" }}
            borderRadius="md"
            mx={1}
          >
            Mint NFT
          </Tab>
          <Tab
            fontSize={isMobile ? "xs" : isTablet ? "sm" : "md"}
            p={isMobile ? 2 : 4}
            fontWeight="bold"
            _selected={{ color: "purple.800", bg: "white", borderColor: "purple.200", boxShadow: "md", fontWeight: "bold" }}
            borderRadius="md"
            mx={1}
          >
            Import NFT
          </Tab>
          <Tab
            fontSize={isMobile ? "xs" : isTablet ? "sm" : "md"}
            p={isMobile ? 2 : 4}
            fontWeight="bold"
            _selected={{ color: "purple.800", bg: "white", borderColor: "purple.200", boxShadow: "md", fontWeight: "bold" }}
            borderRadius="md"
            mx={1}
          >
            AI Agent
          </Tab>
        </TabList>

        <TabPanels overflow="visible" pb={isMobile ? 20 : 16} mb={isMobile ? 16 : 12} pt={4} className="tab-panels-with-fixed-header">
          <TabPanel p={isMobile ? 2 : 4} overflow="visible" minHeight="600px" maxHeight="none">
            <Box mb={0} p={0}>
              <Heading size="lg" mb={4} p={3} textAlign="center" bg="rgba(7, 7, 7, 0)" borderRadius="md" boxShadow="sm">Your NFTs</Heading>
              <Divider mb={4} />

              {isLoading ? (
                <Box textAlign="center" py={isMobile ? 5 : 10}>
                  <Heading size="sm">Loading your NFTs...</Heading>
                </Box>
              ) : nfts.length === 0 ? (
                <Box textAlign="center" py={isMobile ? 5 : 10} bg="gray.50" borderRadius="md">
                  <Heading size="sm">You don't have any NFTs yet</Heading>
                </Box>
              ) : (
                <Box className="card-container" width="100%" minHeight="500px">
                  <Grid
                    templateColumns={{
                      base: "repeat(1, minmax(0, 1fr))",
                      sm: "repeat(2, minmax(0, 1fr))",
                      md: "repeat(3, minmax(0, 1fr))",
                      lg: "repeat(4, minmax(0, 1fr))",
                      xl: "repeat(5, minmax(0, 1fr))"
                    }}
                    gap={isMobile ? 2 : 4}
                    width="100%"
                    className="responsive-grid"
                    px={isMobile ? 1 : 3}
                  >
                  {nfts.map((nft) => (
                    <StakingCard
                      key={nft.tokenId}
                      nft={nft}
                      stakingContract={stakingContract}
                      nftContract={nftContract}
                      provider={provider}
                      onStakeSuccess={handleRefresh}
                      isMobile={isMobile}
                      isTablet={isTablet}
                      isLandscape={isLandscape}
                    />
                  ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </TabPanel>

          <TabPanel p={isMobile ? 2 : 4} overflow="visible" minHeight="600px" maxHeight="none">
            {stakingContract && nftContract && (
              <StakedNFTs
                stakingContract={stakingContract}
                nftContract={nftContract}
                account={account}
                isMobile={isMobile}
                isTablet={isTablet}
                isLandscape={isLandscape}
                isDesktop={isDesktop}
              />
            )}
          </TabPanel>

          <TabPanel p={isMobile ? 2 : 4} overflow="visible" minHeight="600px" maxHeight="none">
            {provider && account && nftContract && (
              <AuctionNFTs
                provider={provider}
                account={account}
                nftContract={nftContract}
                auctionAddress={auctionAddress}
                isMobile={isMobile}
                isTablet={isTablet}
                isLandscape={isLandscape}
                isDesktop={isDesktop}
              />
            )}
          </TabPanel>

          <TabPanel p={isMobile ? 2 : 4} overflow="visible" minHeight="600px" maxHeight="none">
            {nftContract && (
              <MintNFT
                nftContract={nftContract}
                account={account}
                onMintSuccess={handleRefresh}
                isMobile={isMobile}
                isTablet={isTablet}
                isLandscape={isLandscape}
                isDesktop={isDesktop}
              />
            )}
          </TabPanel>

          <TabPanel p={isMobile ? 2 : 4} overflow="visible" minHeight="600px" maxHeight="none">
            {provider && account && (
              <ImportNFT
                provider={provider}
                account={account}
                isMobile={isMobile}
                isTablet={isTablet}
                isLandscape={isLandscape}
                isDesktop={isDesktop}
              />
            )}
          </TabPanel>

          <TabPanel p={isMobile ? 2 : 4} overflow="visible" minHeight="600px" maxHeight="none">
            <AIAgent
              isMobile={isMobile}
              isTablet={isTablet}
              isLandscape={isLandscape}
              isDesktop={isDesktop}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default NFTMarketplace;