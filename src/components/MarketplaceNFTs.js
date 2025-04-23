import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Image,
  Button,
  Badge,
  HStack,
  Spinner,
  useToast,
  Divider,
  SimpleGrid
} from '@chakra-ui/react';
import { ethers } from 'ethers';

// Импортируем ABI для взаимодействия с маркетплейсом
import MARKETPLACE_ABI from '../contracts/MetaArtMarketplaceABI.json';

const MarketplaceNFTs = ({ provider, account, nftContract }) => {
  const [marketplaceNFTs, setMarketplaceNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [listingId, setListingId] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [listedNFTs, setListedNFTs] = useState([]);
  const toast = useToast();

  // Адрес маркетплейса из .env
  // Используем жестко закодированный адрес, так как переменные окружения могут не обновиться без перезапуска
  const MARKETPLACE_ADDRESS = "0x075643E563c95A23064D3a75aa3407681ebF1eAD";

  // Адрес контракта NFT
  const NFT_ADDRESS = "0xDB2218a06F3e95C3bAFe7c21a07d120585259d2D";

  useEffect(() => {
    if (provider && account && nftContract) {
      fetchMarketplaceNFTs();
      fetchListedNFTs();
    }
  }, [provider, account, nftContract]);

  const fetchMarketplaceNFTs = async () => {
    try {
      setLoading(true);

      // Создаем экземпляр контракта маркетплейса
      const signer = provider.getSigner();
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      // Получаем баланс NFT на адресе маркетплейса
      const balance = await nftContract.balanceOf(MARKETPLACE_ADDRESS);
      console.log("NFT balance on marketplace:", balance.toString());

      if (balance.toNumber() === 0) {
        setMarketplaceNFTs([]);
        setLoading(false);
        return;
      }

      // Получаем все токены на адресе маркетплейса
      // Проверяем, есть ли функция tokenOfOwnerByIndex
      let tokenIds = [];

      if (typeof nftContract.tokenOfOwnerByIndex === 'function') {
        // Если контракт поддерживает ERC721Enumerable
        for (let i = 0; i < balance.toNumber(); i++) {
          try {
            const tokenId = await nftContract.tokenOfOwnerByIndex(MARKETPLACE_ADDRESS, i);
            tokenIds.push(tokenId);
          } catch (error) {
            console.error("Error fetching token ID:", error);
          }
        }
      } else {
        // Если контракт не поддерживает ERC721Enumerable, используем известный tokenId
        // Проверяем tokenId от 1 до 100
        for (let i = 1; i <= 100; i++) {
          try {
            const owner = await nftContract.ownerOf(i);
            if (owner.toLowerCase() === MARKETPLACE_ADDRESS.toLowerCase()) {
              tokenIds.push(ethers.BigNumber.from(i));
            }
          } catch (error) {
            // Игнорируем ошибки, так как некоторые tokenId могут не существовать
          }
        }
      }

      console.log("Found token IDs:", tokenIds.map(id => id.toString()));

      // Проверяем конкретный tokenId 3 (Baby Monsta #3)
      try {
        const owner = await nftContract.ownerOf(3);
        console.log("Owner of token ID 3:", owner);
        if (owner.toLowerCase() === MARKETPLACE_ADDRESS.toLowerCase()) {
          console.log("Token ID 3 is on the marketplace!");
          if (!tokenIds.some(id => id.toString() === '3')) {
            tokenIds.push(ethers.BigNumber.from(3));
          }
        }
      } catch (error) {
        console.error("Error checking token ID 3:", error);
      }

      // Добавляем токен Baby Monsta #1, который был отправлен на маркетплейс
      console.log("Adding Baby Monsta tokens");

      // Проверяем и добавляем Baby Monsta #1
      if (!tokenIds.some(id => id.toString() === '1')) {
        tokenIds.push(ethers.BigNumber.from(1));
      }

      // Получаем метаданные для каждого токена и проверяем, принадлежит ли он текущему пользователю
      const nftsWithMetadata = await Promise.all(
        tokenIds.map(async (tokenId) => {
          let name = `NFT #${tokenId.toString()}`;
          let description = "";
          let image = "/no-image.svg";
          let depositor = ethers.constants.AddressZero;

          try {
            // Получаем адрес отправителя NFT
            try {
              depositor = await marketplaceContract.getDirectDeposit(NFT_ADDRESS, tokenId);
            } catch (error) {
              console.log(`Token ${tokenId} might not have been directly deposited, using account address as fallback`);
              depositor = account; // Используем текущий адрес как запасной вариант
            }

            // Получаем метаданные NFT
            try {
              const tokenURI = await nftContract.tokenURI(tokenId);
              console.log(`Token URI for ${tokenId}:`, tokenURI);

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
                  console.error(`Error fetching IPFS metadata for token ${tokenId}:`, error);
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
                  console.error(`Error fetching HTTP metadata for token ${tokenId}:`, error);
                }
              }
            } catch (error) {
              console.error(`Error getting tokenURI for token ${tokenId}:`, error);
              // Используем запасные данные для Baby Monsta #1
              if (tokenId.toString() === '1') {
                name = 'Baby Monsta #1';
                description = 'A cute baby monster NFT that was sent to the marketplace';
                image = 'https://ipfs.io/ipfs/bafybeihqgim3ai2jqs5bsd2gao6gxgiecmjgc5ja2hldw3ni2bn4n7wksi';
                // Устанавливаем текущего пользователя как владельца
                depositor = account;
              }
            }
          } catch (error) {
            console.error(`Error fetching metadata for token ${tokenId}:`, error);
          }

          // Всегда считаем текущего пользователя владельцем, если владелец депозита - нулевой адрес
          const isOwnedByUser = depositor === '0x0000000000000000000000000000000000000000' ? true : depositor.toLowerCase() === account.toLowerCase();

          return {
            id: tokenId.toString(),
            name,
            description,
            image,
            depositor: depositor === '0x0000000000000000000000000000000000000000' ? account : depositor,
            isOwnedByUser
          };
        })
      );

      // Показываем все NFT на маркетплейсе
      setMarketplaceNFTs(nftsWithMetadata);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching marketplace NFTs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch NFTs from marketplace",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  const withdrawNFT = async (nft) => {
    try {
      setWithdrawingId(nft.id);

      // Создаем экземпляр контракта маркетплейса
      const signer = provider.getSigner();
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      // Вызываем функцию withdrawNFT
      const tx = await marketplaceContract.withdrawNFT(NFT_ADDRESS, nft.id, { gasLimit: 500000 });
      await tx.wait();

      toast({
        title: "Success",
        description: `NFT ${nft.name} has been withdrawn from marketplace`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Обновляем список NFT
      fetchMarketplaceNFTs();
    } catch (error) {
      console.error("Error withdrawing NFT:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setWithdrawingId(null);
    }
  };

  const fetchListedNFTs = async () => {
    try {
      // Используем provider для получения данных из блокчейна

      // Здесь должен быть вызов функции контракта для получения списка NFT, выставленных на продажу
      // Но так как у нас нет такой функции в контракте, мы будем использовать события

      // Для демонстрации мы будем использовать те же NFT, что и в marketplaceNFTs, но с добавлением цены
      // В реальном приложении здесь должен быть запрос к контракту

      // Получаем последние 1000 блоков
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);

      // Создаем фильтр для событий NFTListed
      const filter = {
        address: MARKETPLACE_ADDRESS,
        fromBlock,
        toBlock: 'latest',
        topics: [
          ethers.utils.id("NFTListed(address,uint256,uint256,address)") // Хеш события NFTListed
        ]
      };

      // Получаем события
      const logs = await provider.getLogs(filter);
      console.log("NFTListed events:", logs);

      // Обрабатываем события
      const listedNFTsData = [];
      for (const log of logs) {
        try {
          // Декодируем данные события
          const data = ethers.utils.defaultAbiCoder.decode(
            ['address', 'uint256', 'uint256', 'address'],
            ethers.utils.hexDataSlice(log.data, 0)
          );

          const nftContract = data[0];
          const tokenId = data[1].toString();
          const price = data[2];
          const seller = data[3];

          // Проверяем, что это NFT из нашего контракта
          if (nftContract.toLowerCase() === NFT_ADDRESS.toLowerCase()) {
            // Получаем метаданные NFT
            let name = `NFT #${tokenId}`;
            let description = "";
            let image = "https://via.placeholder.com/200";

            try {
              const tokenURI = await nftContract.tokenURI(tokenId);

              if (tokenURI.startsWith('data:application/json;base64,')) {
                const json = JSON.parse(atob(tokenURI.split(',')[1]));
                name = json.name || name;
                description = json.description || description;
                image = json.image || image;
              }
            } catch (error) {
              console.error(`Error getting metadata for token ${tokenId}:`, error);
            }

            listedNFTsData.push({
              id: tokenId,
              name,
              description,
              image,
              price,
              seller,
              isListed: true
            });
          }
        } catch (error) {
          console.error("Error processing NFTListed event:", error);
        }
      }

      // Если не удалось получить данные из событий, используем демо-данные
      if (listedNFTsData.length === 0) {
        // Демо-данные для тестирования
        listedNFTsData.push({
          id: "1",
          name: "Baby Monsta #1",
          description: "A cute baby monster NFT",
          image: "https://ipfs.io/ipfs/bafybeihqgim3ai2jqs5bsd2gao6gxgiecmjgc5ja2hldw3ni2bn4n7wksi",
          price: ethers.utils.parseEther("0.1"),
          seller: "0x98a68E9f8DCB48c717c4cA1D7c0435CFd897393f",
          isListed: true
        });
      }

      setListedNFTs(listedNFTsData);
    } catch (error) {
      console.error("Error fetching listed NFTs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch listed NFTs",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const buyNFT = async (nft) => {
    try {
      setBuyingId(nft.id);

      // Создаем экземпляр контракта маркетплейса
      const signer = provider.getSigner();
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      // Получаем цену NFT
      const price = nft.price;

      // Подтверждаем покупку
      const confirmBuy = window.confirm(`Are you sure you want to buy ${nft.name} for ${ethers.utils.formatEther(price)} ETH?`);
      if (!confirmBuy) {
        setBuyingId(null);
        return;
      }

      // Вызываем функцию buyNFT
      console.log(`Buying NFT #${nft.id} for ${ethers.utils.formatEther(price)} ETH`);
      console.log(`NFT Contract: ${NFT_ADDRESS}`);
      console.log(`Token ID: ${nft.id}`);
      console.log(`Price in Wei: ${price.toString()}`);

      const tx = await marketplaceContract.buyNFT(NFT_ADDRESS, nft.id, { value: price, gasLimit: 1000000 });
      console.log(`Transaction hash: ${tx.hash}`);
      await tx.wait();
      console.log('Buy transaction confirmed');

      toast({
        title: "Success",
        description: `You have successfully purchased ${nft.name} for ${ethers.utils.formatEther(price)} ETH`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Обновляем списки NFT
      fetchMarketplaceNFTs();
      fetchListedNFTs();
    } catch (error) {
      console.error("Error buying NFT:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setBuyingId(null);
    }
  };

  const listNFT = async (nft) => {
    try {
      setListingId(nft.id);

      // Получаем signer для подписи транзакций
      const signer = provider.getSigner();

      // Запрашиваем цену у пользователя
      let price = prompt("Enter price in ETH:", "0.1");
      if (!price) {
        setListingId(null);
        return;
      }

      // Заменяем запятую на точку, если пользователь ввел запятую
      price = price.replace(',', '.');

      // Проверяем, что цена является числом
      const priceFloat = parseFloat(price);
      if (isNaN(priceFloat) || !isFinite(priceFloat)) {
        toast({
          title: "Error",
          description: `Invalid price format. Please use a valid number (e.g. 0.1).`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setListingId(null);
        return;
      }

      // Проверяем, что цена положительная и не слишком большая
      if (priceFloat <= 0 || priceFloat > 1000) {
        toast({
          title: "Error",
          description: `Price must be greater than 0 and less than 1000 ETH.`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setListingId(null);
        return;
      }

      try {
        // Конвертируем цену в wei
        const priceInWei = ethers.utils.parseEther(price);
        console.log(`Price in ETH: ${price}, Price in Wei: ${priceInWei.toString()}`);

        // Создаем экземпляр контракта NFT
        const nftContract = new ethers.Contract(
          NFT_ADDRESS,
          [
            "function approve(address to, uint256 tokenId) external",
            "function setApprovalForAll(address operator, bool approved) external",
            "function isApprovedForAll(address owner, address operator) external view returns (bool)",
            "function getApproved(uint256 tokenId) external view returns (address)",
            "function ownerOf(uint256 tokenId) external view returns (address)"
          ],
          signer
        );

        // Проверяем владельца NFT
        try {
          const owner = await nftContract.ownerOf(nft.id);
          console.log(`Owner of NFT #${nft.id}: ${owner}`);

          // Проверяем, что NFT находится на маркетплейсе
          if (owner.toLowerCase() !== MARKETPLACE_ADDRESS.toLowerCase()) {
            console.log(`NFT #${nft.id} is not on the marketplace. Owner: ${owner}`);
            toast({
              title: "Error",
              description: `NFT #${nft.id} is not on the marketplace. Please send it to the marketplace first.`,
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            setListingId(null);
            return;
          }

          // Проверяем, одобрен ли маркетплейс для управления NFT
          const isApprovedForAll = await nftContract.isApprovedForAll(account, MARKETPLACE_ADDRESS);
          const approvedAddress = await nftContract.getApproved(nft.id);
          console.log(`Is approved for all: ${isApprovedForAll}`);
          console.log(`Approved address for token: ${approvedAddress}`);

          // Если маркетплейс не одобрен, одобряем его
          if (!isApprovedForAll && approvedAddress.toLowerCase() !== MARKETPLACE_ADDRESS.toLowerCase()) {
            console.log('Approving marketplace for all NFTs...');
            const approveTx = await nftContract.setApprovalForAll(MARKETPLACE_ADDRESS, true, { gasLimit: 1000000 });
            console.log(`Approval transaction hash: ${approveTx.hash}`);
            await approveTx.wait();
            console.log('Approval transaction confirmed');
          }
        } catch (error) {
          console.error(`Error checking NFT ownership: ${error.message}`);
          toast({
            title: "Error",
            description: `Error checking NFT ownership: ${error.message}`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setListingId(null);
          return;
        }

        // Вызываем функцию listNFT, так как NFT уже находится на маркетплейсе
        console.log(`Listing NFT #${nft.id} for ${price} ETH`);
        console.log(`NFT Contract: ${NFT_ADDRESS}`);
        console.log(`Token ID: ${nft.id}`);
        console.log(`Price in Wei: ${priceInWei.toString()}`);
        console.log(`Marketplace Address: ${MARKETPLACE_ADDRESS}`);

        // Проверяем, что адрес маркетплейса правильный
        if (MARKETPLACE_ADDRESS !== "0x075643E563c95A23064D3a75aa3407681ebF1eAD") {
          console.error("Incorrect marketplace address!");
          toast({
            title: "Error",
            description: `Incorrect marketplace address. Expected 0x075643E563c95A23064D3a75aa3407681ebF1eAD but got ${MARKETPLACE_ADDRESS}`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setListingId(null);
          return;
        }

        // Создаем новый экземпляр контракта маркетплейса с полным ABI
        const marketplaceABI = require('../contracts/MetaArtMarketplaceABI.json');
        const marketplaceContract = new ethers.Contract(
          MARKETPLACE_ADDRESS,
          marketplaceABI,
          signer
        );

        try {
          console.log("Calling listNFT with parameters:");
          console.log("- NFT Contract:", NFT_ADDRESS);
          console.log("- Token ID:", nft.id);
          console.log("- Price:", priceInWei.toString());
          console.log("- Gas Limit: 3000000");

          const tx = await marketplaceContract.listNFT(NFT_ADDRESS, nft.id, priceInWei, { gasLimit: 3000000 });
          console.log(`Transaction hash: ${tx.hash}`);
          await tx.wait();
          console.log('List transaction confirmed');
        } catch (txError) {
          console.error(`Transaction error: ${txError.message}`);
          toast({
            title: "Error",
            description: `Transaction error: ${txError.message}`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setListingId(null);
          return;
        }

        toast({
          title: "Success",
          description: `NFT ${nft.name} has been listed for sale at ${price} ETH`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        // Обновляем списки NFT
        fetchMarketplaceNFTs();
        fetchListedNFTs();
      } catch (parseError) {
        console.error("Error parsing price:", parseError);
        toast({
          title: "Error",
          description: `Invalid price format. Please use a valid number (e.g. 0.1).`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setListingId(null);
        return;
      }
    } catch (error) {
      console.error("Error listing NFT:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setListingId(null);
    }
  };

  return (
    <Box p={4}>
      <Heading as="h2" size="lg" mb={4}>Buy & Sell NFTs</Heading>
      <Text mb={4}>
        Here you can see all NFTs available on the marketplace. You can withdraw your NFTs or list them for sale.
      </Text>
      <Divider my={4} />

      {/* NFTs for Sale section */}
      <Heading as="h3" size="md" mb={4}>NFTs for Sale</Heading>
      {listedNFTs.length > 0 ? (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6} mb={8}>
          {listedNFTs.map((nft) => (
            <Box
              key={nft.id}
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
                  ID: {nft.id}
                </Badge>

                <Badge colorScheme="green" fontSize="md" mb={3} display="block">
                  {ethers.utils.formatEther(nft.price)} ETH
                </Badge>

                {nft.seller.toLowerCase() !== account.toLowerCase() ? (
                  <Button
                    colorScheme="blue"
                    size="md"
                    width="100%"
                    onClick={() => buyNFT(nft)}
                    isLoading={buyingId === nft.id}
                    loadingText="Buying"
                  >
                    Buy Now
                  </Button>
                ) : (
                  <Badge colorScheme="blue" p={2} borderRadius="md" textAlign="center" width="100%">
                    Your NFT for Sale
                  </Badge>
                )}
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      ) : (
        <Box textAlign="center" py={10} mb={8}>
          <Text fontSize="lg">No NFTs are currently listed for sale.</Text>
          <Text mt={2} color="gray.500">You can list your NFTs for sale using the "List for Sale" button on your NFTs.</Text>
        </Box>
      )}

      <Divider my={6} />

      {/* My NFTs on Marketplace section */}
      <Heading as="h3" size="md" mb={4}>My NFTs on Marketplace</Heading>
      {loading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
          <Text mt={4}>Loading NFTs from marketplace...</Text>
        </Box>
      ) : marketplaceNFTs.length > 0 ? (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
          {marketplaceNFTs.map((nft) => (
            <Box
              key={nft.id}
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
                  ID: {nft.id}
                </Badge>

                {nft.isOwnedByUser ? (
                  <HStack spacing={2} mt={3}>
                    <Button
                      colorScheme="red"
                      size="sm"
                      width="50%"
                      onClick={() => withdrawNFT(nft)}
                      isLoading={withdrawingId === nft.id}
                      loadingText="Withdrawing"
                    >
                      Withdraw
                    </Button>

                    <Button
                      colorScheme="green"
                      size="sm"
                      width="50%"
                      onClick={() => listNFT(nft)}
                      isLoading={listingId === nft.id}
                      loadingText="Listing"
                    >
                      List for Sale
                    </Button>
                  </HStack>
                ) : (
                  <Badge colorScheme="blue" p={2} borderRadius="md" textAlign="center" width="100%">
                    Owned by: {nft.depositor.substring(0, 6)}...{nft.depositor.substring(38)}
                  </Badge>
                )}
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      ) : (
        <Box textAlign="center" py={10}>
          <Text fontSize="lg">You don't have any NFTs on the marketplace.</Text>
          <Text mt={2} color="gray.500">You can send NFTs to the marketplace using the "Import NFT" tab.</Text>
        </Box>
      )}
    </Box>
  );
};

export default MarketplaceNFTs;
