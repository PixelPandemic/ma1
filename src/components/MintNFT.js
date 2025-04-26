import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  Text,
  Flex
} from '@chakra-ui/react';
import { useTrackTransaction } from '../utils/transactions';

const MintNFT = ({ nftContract, account, onMintSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const trackTransaction = useTrackTransaction();

  const handleMint = async () => {
    if (!name || !description || !imageUrl) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all fields',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);

      // Create metadata
      const metadata = {
        name,
        description,
        image: imageUrl
      };

      // In a real app, you would upload this to IPFS
      // For this example, we'll use a mock URI
      const tokenURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;

      // Mint the NFT
      const tx = await nftContract.mintNFT(account, tokenURI);

      // Отслеживаем транзакцию в RainbowKit
      trackTransaction(
        tx.hash,
        `Minting NFT: ${name}`,
        1 // Ждем 1 подтверждение
      );

      await tx.wait();

      toast({
        title: 'NFT Minted',
        description: 'Your NFT has been successfully minted!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setName('');
      setDescription('');
      setImageUrl('');

      // Notify parent component
      if (onMintSuccess) {
        onMintSuccess();
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast({
        title: 'Minting Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box borderWidth="1px" borderRadius="lg" p={6} mb={8} className="card" color="#333" minHeight="calc(100vh - 200px)" pb={20}>
      <Heading size="md" mb={4}>Mint New NFT</Heading>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>NFT Name</FormLabel>
          <Input
            placeholder="Enter NFT name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Description</FormLabel>
          <Input
            placeholder="Enter description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Image URL</FormLabel>
          <Input
            placeholder="Enter image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <Box mt={2} p={4} bg="blue.50" borderRadius="md" fontSize="sm" mb={4} maxH="none" overflowY="visible" className="instruction-box">
            <Text fontWeight="bold" mb={2} fontSize="md">How to add an image URL using Pinata and IPFS:</Text>
            <Text mb={2}>1. Go to <a href="https://pinata.cloud" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline', color: 'blue', fontWeight: 'bold'}}>Pinata.cloud</a> and create a free account</Text>
            <Text mb={2}>2. Click on "Upload" and select your image file</Text>
            <Text mb={2}>3. After upload, click on the file name to view details</Text>
            <Text mb={2}>4. Find the "IPFS CID" (Content Identifier) of your file</Text>
            <Text mb={2}>5. Create a public URL using one of these formats:</Text>
            <Box p={2} bg="white" borderRadius="md" mb={2}>
              <Text fontFamily="monospace" fontSize="xs" mb={1}>https://ipfs.io/ipfs/YOUR_CID</Text>
              <Text fontFamily="monospace" fontSize="xs" mb={1}>https://gateway.pinata.cloud/ipfs/YOUR_CID</Text>
              <Text fontFamily="monospace" fontSize="xs">https://cloudflare-ipfs.com/ipfs/YOUR_CID</Text>
            </Box>
            <Text fontWeight="bold" mb={1}>Example:</Text>
            <Box p={2} bg="white" borderRadius="md">
              <Text fontFamily="monospace" fontSize="xs" mb={0}>https://ipfs.io/ipfs/</Text>
              <Text fontFamily="monospace" fontSize="xs" mt={0}>bafybeihqgim3ai2jqs5bsd2gao6gxgiecmjgc5ja2hldw3ni2bn4n7wksi</Text>
            </Box>
          </Box>
        </FormControl>

        <Button
          colorScheme="purple"
          onClick={handleMint}
          isLoading={isLoading}
          loadingText="Minting"
          mt={2}
        >
          Mint NFT
        </Button>

        {imageUrl && (
          <Box mt={4}>
            <Text fontWeight="medium" mb={2}>Preview:</Text>
            <Flex justifyContent="center">
              <Box maxW="200px" borderWidth="1px" borderRadius="lg" overflow="hidden">
                <img src={imageUrl} alt="NFT Preview" style={{ width: '100%' }} />
              </Box>
            </Flex>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default MintNFT;
