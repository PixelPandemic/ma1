import { useState, useRef, useEffect } from 'react';
import { generateResponse } from '../services/openrouter';
import {
  Box,
  Heading,
  Text,
  VStack,
  Input,
  Button,
  Divider,
  HStack,
  Badge,
  Flex,
  Icon,
  Spinner,
  Image,
  SimpleGrid,
  Tooltip
} from '@chakra-ui/react';
import { FiSend, FiUser, FiCpu, FiMessageCircle } from 'react-icons/fi';
import { FaBrain } from 'react-icons/fa';
import ModelSelector from './ModelSelector';
import { OPENROUTER_MODELS, MODEL_PRESETS } from '../config/openrouter-models';

// Стили для кнопок с темами
const buttonHoverStyle = {
  color: "white"
};

// Темы для кнопок
const topics = [
  { id: 'auction', label: 'NFT Auction', description: 'How to auction NFTs' },
  { id: 'staking', label: 'NFT Staking', description: 'How to stake NFTs' },
  { id: 'minting', label: 'Mint NFT', description: 'How to mint new NFTs' },
  { id: 'import', label: 'Import NFT', description: 'How to import NFTs' },
  { id: 'art-token', label: 'ART Token', description: 'About ART token' },
  { id: 'blockchain', label: 'Blockchain', description: 'Blockchain info' },
  { id: 'contract', label: 'Contracts', description: 'Contract addresses' },
  { id: 'platform', label: 'Platform', description: 'About Meta ART' },
  { id: 'social', label: 'Social Media', description: 'Social media links' }
];

// Ответы на темы
const topicResponses = {
  'auction': 'To auction your NFT on Meta ART:\n\n1. Go to the "My NFTs" section\n2. Find the NFT you want to auction\n3. Click the "Auction" button\n4. Set a starting price and auction duration\n5. Confirm the transaction in your wallet\n\nThe platform charges a 5% commission on successful auctions and 10% for "Buy Now". Buyers can place bids or use the "Buy Now".',

  'staking': 'Staking NFTs on Meta ART earns you ART tokens as rewards:\n\n1. Go to the "My NFTs" section\n2. Find the NFT you want to stake\n3. Click the "Stake" button\n4. Confirm the transaction in your wallet\n\nReward structure:\n- 10 ART tokens per hour\n- +10 tokens for each subsequent hour (20 in hour 2, 30 in hour 3, etc.)\n\nYou can unstake your NFT at any time to claim your rewards.',

  'minting': 'To mint a new NFT on Meta ART:\n\n1. Go to the "Mint NFT" section\n2. Upload your image or provide an IPFS URL\n3. Enter a name and description for your NFT\n4. Click "Mint NFT"\n5. Confirm the transaction in your wallet\n\nThe platform charges a 5% commission fee for minting. Your NFT will appear in your wallet and in the "My NFTs" section after minting.',

  'import': 'To import NFTs from other contracts:\n\n1. Go to the "Import NFT" section\n2. Connect your wallet if not already connected\n3. Your NFTs from other contracts will be automatically displayed\n4. Select the NFT you want to import\n5. Choose to auction or stake the imported NFT\n6. Confirm the transaction in your wallet\n\nThis allows you to use NFTs from other collections on our platform.',

  'art-token': 'ART Token Information:\n\n- Total Supply: 100,000,000,000,000 tokens\n- Utility: Platform governance, staking rewards, transaction fees\n- Earning: Stake NFTs to earn ART tokens (10 tokens per hour with +10 for each subsequent hour)\n- Usage: Can be used for platform fees, purchasing NFTs, and participating in governance\n\nART tokens are native to the Meta ART platform on Polygon Amoy testnet.',

  'blockchain': 'Meta ART operates on the Polygon Amoy testnet:\n\n- Network Name: Polygon Amoy\n- RPC URL: https://polygon-amoy.blockpi.network/v1/rpc/public\n- Chain ID: 80002\n- Currency Symbol: MATIC\n- Block Explorer: https://www.oklink.com/amoy\n\nPolygon offers fast and low-cost transactions, making it ideal for NFT operations. The Amoy testnet allows for testing without using real funds.',

  'contract': 'Contract Addresses:\n\n- Meta ART NFT Marketplace: 0x075643E563c95A23064D3a75aa3407681ebF1eAD\n- NFT Contract: 0xDB2218a06F3e95C3bAFe7c21a07d120585259d2D\n- ART Token Contract: 0xF20F40891b3983416294C013304b4C8E012b9B02\n\nAll contracts are deployed on the Polygon Amoy testnet. The fee collector/project owner address is 0x98a68E9f8DCB48c717c4cA1D7c0435CFd897393f.',

  'platform': 'Meta ART is an NFT marketplace on Polygon Amoy testnet featuring:\n\n- NFT Minting: Create your own NFTs\n- NFT Auctions: Sell your NFTs with auction or buy-now options\n- NFT Staking: Earn ART tokens by staking your NFTs\n- NFT Importing: Use NFTs from other contracts\n- ART Token: Earn rewards through staking\n\nThe platform charges a 5% commission on transactions, minting, and staking, and 10% on auctions with buy-now option.',

  'social': 'Connect with Meta ART on social media:\n\n- Telegram: [Coming Soon]\n- Twitter: [Coming Soon]\n- Discord: [Coming Soon]\n\nFollow us for updates, announcements, and community events!'
};

const AIAgent = ({ isMobile }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am the Meta ART AI Assistant. How can I help you with NFTs, auctions, or staking today? You can select a topic or ask me any question about the platform.',
      suggestedTopics: topics, // Предлагаем все темы
      isInitialMessage: true // Пометка, что это начальное сообщение
    }
  ]);

  // State for model selection and routing
  const [selectedModel, setSelectedModel] = useState(OPENROUTER_MODELS.auto.id);
  const [selectedPreset, setSelectedPreset] = useState('auto');
  const [fallbackModels, setFallbackModels] = useState(MODEL_PRESETS.auto.fallbacks);
  const [isLoading, setIsLoading] = useState(false);
  const [aiPowerMode, setAiPowerMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', status: 'info' });

  // Ссылка на контейнер чата для автоматической прокрутки
  const chatContainerRef = useRef(null);

  // Эффект для автоматической прокрутки при изменении сообщений
  useEffect(() => {
    if (chatContainerRef.current) {
      // Прокрутка вниз с небольшой задержкой, чтобы анимация успела завершиться
      setTimeout(() => {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }, 100);
    }
  }, [messages, isLoading]); // Прокручиваем при изменении сообщений или статуса загрузки

  // Эффект для обновления начального сообщения при изменении режима Super Power
  useEffect(() => {
    // Обновляем начальное сообщение при изменении режима Super Power
    setMessages(prevMessages => {
      return prevMessages.map(msg => {
        // Если это начальное сообщение, обновляем флаг isEnhanced и содержимое
        if (msg.isInitialMessage) {
          const standardMessage = 'Hello! I am the Meta ART AI Assistant. How can I help you with NFTs, auctions, or staking today? You can select a topic or ask me any question about the platform.';
          const superPowerMessage = '[Super Power]\n\nHi there! 👋 How can I help you today?\n\nIn Super Power mode, I can:\n• Answer questions on any topic in any language\n• Write code in different programming languages\n• Help with planning and organizing tasks\n• Provide detailed and nuanced responses\n\nWhat would you like to talk about?';

          return {
            ...msg,
            isEnhanced: aiPowerMode,
            content: aiPowerMode ? superPowerMessage : standardMessage
          };
        }
        return msg;
      });
    });
  }, [aiPowerMode]); // Запускаем эффект при изменении режима Super Power

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInput(newValue);
  };

  // Обработчик выбора темы
  const handleTopicSelect = (topicId) => {
    // Добавляем сообщение пользователя
    const topic = topics.find(t => t.id === topicId);
    const userMessage = { role: 'user', content: `Tell me about ${topic.label}` };
    setMessages([...messages, userMessage]);

    // Добавляем ответ ассистента
    setIsLoading(true);

    setTimeout(() => {
      const response = topicResponses[topicId];
      const assistantMessage = {
        role: 'assistant',
        content: response,
        // Добавляем предложение всех тем только если не включен режим Super Power
        suggestedTopics: topics,
        // Если включен режим Super Power, помечаем сообщение как enhanced
        isEnhanced: aiPowerMode
      };
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  // Функция для показа уведомления
  const showNotification = (message, status = 'info') => {
    setNotification({ show: true, message, status });

    // Скрываем уведомление через 3 секунды
    setTimeout(() => {
      setNotification({ show: false, message: '', status: 'info' });
    }, 3000);
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);

    // Clear input field
    setInput('');

    // Set loading state
    setIsLoading(true);

    try {
      if (aiPowerMode) {
        // В режиме Super Power отправляем запрос к OpenRouter API
        try {
          // Получаем историю сообщений для контекста
          const messageHistory = messages.slice(-5); // Берем последние 5 сообщений для контекста

          // Добавляем инструкции для модели
          const systemMessage = {
            role: 'system',
            content: `You are an advanced AI assistant powered by a large language model.

            CRITICAL LANGUAGE INSTRUCTIONS:
            - ALWAYS detect the language of the user's message and respond in the SAME language
            - For common greetings in ANY language, respond with an appropriate greeting in that language
            - Here are examples of greetings in different languages that you MUST recognize:
              * "привет", "здравствуйте" (Russian) → respond in Russian
              * "hello", "hi" (English) → respond in English
              * "hola", "buenos días" (Spanish) → respond in Spanish
              * "bonjour", "salut" (French) → respond in French
              * "ciao", "salve" (Italian) → respond in Italian
              * "hallo", "guten tag" (German) → respond in German
              * "olá", "oi" (Portuguese) → respond in Portuguese
              * "こんにちは", "やあ" (Japanese) → respond in Japanese
              * "你好", "您好" (Chinese) → respond in Chinese
              * "안녕하세요", "안녕" (Korean) → respond in Korean
              * "مرحبا", "السلام عليكم" (Arabic) → respond in Arabic
              * "apa kabar", "halo" (Indonesian) → respond in Indonesian
              * "chào", "xin chào" (Vietnamese) → respond in Vietnamese
              * "สวัสดี" (Thai) → respond in Thai
              * "namaste", "नमस्ते" (Hindi) → respond in Hindi

            CRITICAL CONTENT INSTRUCTIONS:
            - Do NOT include information about the Meta ART platform in your responses unless specifically asked about it
            - For greetings in any language, respond ONLY with an appropriate greeting in the same language, do not explain what the greeting means
            - Do not treat greetings as questions about a topic - respond as if someone is greeting you

            EXAMPLES OF CORRECT RESPONSES:
            User: "привет"
            Assistant: "[Super Power]\n\nПривет! Как я могу вам помочь сегодня?"

            User: "hola"
            Assistant: "[Super Power]\n\n¡Hola! ¿Cómo puedo ayudarte hoy?"

            User: "apa kabar"
            Assistant: "[Super Power]\n\nHalo! Apa kabar? Ada yang bisa saya bantu hari ini?"

            User: "こんにちは"
            Assistant: "[Super Power]\n\nこんにちは！今日はどのようにお手伝いできますか？"

            Always start your response with "[Super Power]" to indicate that you're using the enhanced AI capabilities.`
          };

          // Логируем информацию о выбранной модели
          console.log('Sending request to OpenRouter API with input:', input);
          console.log('System message:', systemMessage);
          console.log('Message history:', messageHistory);
          console.log(`Using model: ${selectedModel}`);
          if (fallbackModels && fallbackModels.length > 0) {
            console.log(`Using fallback models: ${JSON.stringify(fallbackModels)}`);
          }

          // Отправляем запрос с выбранной моделью и резервными моделями
          generateResponse(input, [systemMessage, ...messageHistory], selectedModel, fallbackModels.length > 0 ? fallbackModels : null)
            .then(response => {
              console.log('Received response from OpenRouter API:', response);

              // Проверяем, не является ли ответ шаблонным
              const isTemplateResponse = response.includes(`Thank you for your question about "${input}".`) &&
                                        response.includes("In Super Power mode, I can provide information on virtually any topic");

              if (isTemplateResponse) {
                console.warn('Detected template response, this might indicate that the demo response was used instead of the real API');
              }

              // Добавляем ответ в чат
              const assistantMessage = {
                role: 'assistant',
                content: response,
                // Не добавляем suggestedTopics для ответов в режиме Super Power
                isEnhanced: true, // Пометка, что это ответ в режиме Super Power
                isTemplateResponse: isTemplateResponse // Добавляем флаг, если это шаблонный ответ
              };
              setMessages(prevMessages => [...prevMessages, assistantMessage]);
              setIsLoading(false);
            })
            .catch(error => {
              console.error('Error getting AI response:', error);

              // Extract the most relevant error message
              let errorMessage = error.message;
              if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
              }

              // Show a more user-friendly notification
              showNotification(`Connection issue: ${errorMessage}`, 'error');
              setIsLoading(false);

              // Create a more helpful fallback response
              let fallbackResponse = `[Super Power]

I apologize, but I'm having trouble connecting to the AI service at the moment.`;

              // Add specific advice based on error type
              if (error.message.includes('502') || error.message.includes('Gateway')) {
                fallbackResponse += `\n\nThe server returned a 502 Bad Gateway error. This usually indicates a temporary issue with the service.`;
              } else if (error.message.includes('timeout')) {
                fallbackResponse += `\n\nThe request timed out. This could be due to high server load or network issues.`;
              } else if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
                fallbackResponse += `\n\nRate limit exceeded. Please wait a moment before trying again.`;
              }

              fallbackResponse += `\n\nYou asked about "${input}". Please try:

1. Selecting a different AI model from the dropdown menu
2. Refreshing the page and trying again
3. Asking a shorter or simpler question
4. Trying again in a few minutes`;

              const fallbackMessage = {
                role: 'assistant',
                content: fallbackResponse,
                isEnhanced: true,
                isError: true // Add a flag to identify error messages
              };
              setMessages(prevMessages => [...prevMessages, fallbackMessage]);
            });
        } catch (error) {
          console.error('Error in Super Power mode:', error);
          showNotification('An error occurred in Super Power mode', 'error');
          setIsLoading(false);
        }
      } else {
        // Стандартный режим с предопределенными ответами
        setTimeout(() => {
          // Check for keywords in the input
          const lowercaseInput = input.toLowerCase();
          let response = '';
          let matchedTopic = false;

          // Проверяем ключевые слова для каждой темы
          if (lowercaseInput.includes('stake') || lowercaseInput.includes('staking')) {
            response = topicResponses['staking'];
            matchedTopic = true;
          } else if (lowercaseInput.includes('auction') || lowercaseInput.includes('sell')) {
            response = topicResponses['auction'];
            matchedTopic = true;
          } else if (lowercaseInput.includes('mint') || lowercaseInput.includes('create')) {
            response = topicResponses['minting'];
            matchedTopic = true;
          } else if (lowercaseInput.includes('import') || lowercaseInput.includes('external')) {
            response = topicResponses['import'];
            matchedTopic = true;
          } else if (lowercaseInput.includes('token') || lowercaseInput.includes('art token') || lowercaseInput.includes('reward')) {
            response = topicResponses['art-token'];
            matchedTopic = true;
          } else if (lowercaseInput.includes('blockchain') || lowercaseInput.includes('network') || lowercaseInput.includes('polygon')) {
            response = topicResponses['blockchain'];
            matchedTopic = true;
          } else if (lowercaseInput.includes('contract') || lowercaseInput.includes('address')) {
            response = topicResponses['contract'];
            matchedTopic = true;
          } else if (lowercaseInput.includes('platform') || lowercaseInput.includes('meta art') || lowercaseInput.includes('about')) {
            response = topicResponses['platform'];
            matchedTopic = true;
          } else if (lowercaseInput.includes('social') || lowercaseInput.includes('twitter') || lowercaseInput.includes('telegram')) {
            response = topicResponses['social'];
            matchedTopic = true;
          }

          // Если не нашли совпадений, даем общий ответ
          if (!matchedTopic) {
            response = 'I\'m here to help with questions about NFTs, auctions, staking, and the Meta ART platform. You can also click on one of the topic buttons below to get specific information about a topic.';
          }

          // Add AI response to chat with suggested topics
          const assistantMessage = {
            role: 'assistant',
            content: response,
            // Добавляем предложение всех тем только если не включен режим Super Power
            suggestedTopics: topics,
            // Если включен режим Super Power, помечаем сообщение как enhanced
            isEnhanced: aiPowerMode
          };
          setMessages(prevMessages => [...prevMessages, assistantMessage]);
          setIsLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      showNotification('Failed to get a response. Please try again.', 'error');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Функция для переключения режима AI Power
  const toggleAiPowerMode = () => {
    if (!aiPowerMode) {
      // Включаем режим AI Power
      setIsConnecting(true);

      // Имитируем подключение к API
      setTimeout(() => {
        setAiPowerMode(true);
        setIsConnecting(false);

        // Показываем уведомление об успешном подключении
        showNotification('Super Power mode activated!', 'success');
      }, 2000);
    } else {
      // Выключаем режим AI Power
      setAiPowerMode(false);

      // Показываем уведомление о возврате в стандартный режим
      showNotification('Super Power mode disabled, returned to standard mode', 'info');
    }
  };

  return (
    <Box width="100%" maxWidth="100%" overflow="visible">
      <Heading size="lg" mb={4} p={3} textAlign="center" bg="rgba(7, 7, 7, 0)" borderRadius="md" boxShadow="sm" color="#4A5568">
        AI Assistant
      </Heading>
      <Divider mb={4} />

      <VStack spacing={4} align="stretch" height={isMobile ? "50vh" : "60vh"} maxH={isMobile ? "400px" : "600px"} overflow="visible">
        {/* Chat messages container */}
        <Box
          ref={chatContainerRef}
          flex="1"
          overflowY="auto"
          overflowX="visible"
          p={isMobile ? 2 : 4}
          borderRadius="md"
          bg="rgba(255, 255, 255, 0.05)"
          boxShadow="inner"
          mb={4}
          width="100%"
          maxWidth="100%"
        >
          <VStack spacing={4} align="stretch">
            {messages.map((message, index) => (
              <Flex
                key={index}
                alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
                maxW={isMobile ? "95%" : "90%"}
                bg={message.role === 'user' ? 'purple.500' : 'gray.700'}
                color="white"
                p={3}
                borderRadius="lg"
                position="relative"
                flexWrap="wrap"
                width={isMobile ? "95%" : "auto"}
                flexDirection="column"
                alignItems="flex-start"
              >
                <Flex alignItems="center" width="100%" mb={message.image ? 2 : 0}>
                  <Icon
                    as={message.role === 'user' ? FiUser : message.isEnhanced ? FaBrain : FiCpu}
                    mr={2}
                    flexShrink={0}
                    color={message.role === 'user' ? 'white' : message.isEnhanced ? 'green.200' : 'purple.200'}
                    boxSize={4}
                  />
                  <Box width="calc(100% - 24px)" overflow="visible" maxWidth="100%">
                    {message.isEnhanced && (
                      <>
                        <Badge colorScheme={message.isError ? "red" : "green"} mb={1} fontSize="xs" px={2} py={1} borderRadius="md" boxShadow={message.isError ? "0 0 5px #E53E3E" : "0 0 5px #48BB78"}>
                          {message.isError ? "Connection Error" : "Super Power"}
                        </Badge>
                        {message.isTemplateResponse && (
                          <Badge colorScheme="orange" ml={1} mb={1} fontSize="xs" px={2} py={1} borderRadius="md">
                            Demo Response
                          </Badge>
                        )}
                      </>
                    )}
                    <Text
                      wordBreak="normal"
                      overflowWrap="break-word"
                      whiteSpace="pre-wrap"
                      fontSize={isMobile ? "sm" : "md"}
                      width="100%"
                      display="block"
                      mb={message.suggestedTopics ? 3 : 0}
                      borderLeft={
                        message.isError
                          ? "2px solid #E53E3E"
                          : message.isEnhanced
                            ? "2px solid #48BB78"
                            : "none"
                      }
                      pl={message.isEnhanced || message.isError ? 2 : 0}
                      bg={
                        message.isError
                          ? "rgba(229, 62, 62, 0.05)"
                          : message.isEnhanced
                            ? "rgba(72, 187, 120, 0.05)"
                            : "transparent"
                      }
                    >
                      {message.content}
                    </Text>

                    {/* Предложенные темы в сообщении - показываем только если не включен режим Super Power */}
                    {message.suggestedTopics && message.suggestedTopics.length > 0 && !message.isEnhanced && !aiPowerMode && (
                      <Box mt={3} p={3} bg="rgba(76, 29, 149, 0.05)" borderRadius="md" boxShadow="sm" width="100%" maxWidth="100%" mx="auto">
                        <Text fontSize="xs" mb={3} color="purple.200" fontWeight="bold" textAlign="center">
                          Select a topic to learn more:
                        </Text>
                        <SimpleGrid columns={3} spacing={3} rowGap={3} justifyItems="start" width="100%">
                          {message.suggestedTopics.map((topic) => (
                            <Button
                              key={topic.id}
                              size="xs"
                              colorScheme="purple"
                              variant="ghost"
                              onClick={() => handleTopicSelect(topic.id)}
                              role="group"
                              height="auto"
                              width="auto"
                              minW="auto"
                              maxW="auto"
                              pl={1}
                              pr={2}
                              py={1.5}
                              fontSize="0.7rem"
                              display="flex"
                              alignItems="center"
                              justifyContent="flex-start"
                              textAlign="left"
                              gap={2}
                              _hover={buttonHoverStyle}
                              mb={1}
                            >
                              <Icon as={FiMessageCircle} boxSize={4} flexShrink={0} color="purple.400" ml={0} _groupHover={{ color: "white" }} />
                              <Text as="span" color="purple.500" fontWeight="medium" fontSize="0.7rem" lineHeight="1.2" textAlign="left" _groupHover={{ color: "white" }}>
                                {topic.label}
                              </Text>
                            </Button>
                          ))}
                        </SimpleGrid>
                      </Box>
                    )}
                  </Box>
                </Flex>

                {message.image && (
                  <Box mt={2} width="100%" textAlign="center">
                    <Image
                      src={message.image}
                      alt="AI Generated Image"
                      borderRadius="md"
                      maxW="100%"
                      maxH="300px"
                      mx="auto"
                    />
                  </Box>
                )}
              </Flex>
            ))}
            {isLoading && (
              <Flex
                alignSelf="flex-start"
                maxW={isMobile ? "95%" : "90%"}
                width={isMobile ? "95%" : "auto"}
                bg="gray.700"
                color="white"
                p={3}
                borderRadius="lg"
                flexWrap="wrap"
                flexDirection="row"
                alignItems="flex-start"
              >
                <Icon
                  as={aiPowerMode ? FaBrain : FiCpu}
                  mr={2}
                  mt={1}
                  flexShrink={0}
                  color={aiPowerMode ? "green.200" : "purple.200"}
                  boxSize={4}
                />
                <Spinner
                  size="sm"
                  mr={2}
                  flexShrink={0}
                  color="purple.200"
                />
                <Text
                  wordBreak="normal"
                  overflowWrap="break-word"
                  whiteSpace="pre-wrap"
                  fontSize={isMobile ? "sm" : "md"}
                  width="calc(100% - 50px)"
                  display="block"
                >
                  {aiPowerMode ? "Processing with Super Power..." : "Thinking..."}
                </Text>
              </Flex>
            )}
          </VStack>
        </Box>

        {/* Input area */}
        <VStack spacing={1} width="100%" maxWidth={isMobile ? "100%" : "800px"} mx="auto">
          <HStack spacing={2} width="100%">
          <Tooltip
            label={aiPowerMode ? "Disable Super Power mode" : "Enable Super Power mode"}
            placement="top"
            hasArrow
            bg={aiPowerMode ? "green.600" : "red.600"}
          >
            <Button
              colorScheme={aiPowerMode ? "green" : "red"}
              variant="solid"
              onClick={toggleAiPowerMode}
              borderRadius="md"
              size={isMobile ? "md" : "lg"}
              leftIcon={<FaBrain />}
              aria-label="AI Power"
              transition="all 0.3s"
              _hover={{ transform: "scale(1.05)" }}
              isLoading={isConnecting}
              loadingText="Connecting..."
              boxShadow={aiPowerMode ? "0 0 10px #48BB78" : "none"}
              opacity={isConnecting ? 0.8 : 1}
            >
              {aiPowerMode ? "ON" : "OFF"}
            </Button>
          </Tooltip>

          {/* Селектор модели - показываем только в режиме Super Power */}
          {aiPowerMode && (
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              selectedPreset={selectedPreset}
              onPresetChange={setSelectedPreset}
              customFallbacks={fallbackModels}
              onFallbacksChange={setFallbackModels}
              isMobile={isMobile}
            />
          )}

          {/* Уведомление рядом с кнопкой на одной линии */}
          {notification.show && (
            <Box
              ml={2}
              p={2}
              borderRadius="md"
              bg={notification.status === 'success' ? 'green.500' :
                 notification.status === 'error' ? 'red.500' : 'blue.500'}
              color="white"
              fontWeight="medium"
              fontSize="sm"
              textAlign="left"
              boxShadow="md"
              display="flex"
              alignItems="center"
              height={isMobile ? "40px" : "48px"}
            >
              {notification.message}
            </Box>
          )}
          <Input
            placeholder="Ask about NFTs, auctions, staking..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            bg="white"
            color="gray.800"
            _placeholder={{ color: 'gray.500' }}
            borderRadius="md"
            size={isMobile ? "md" : "lg"}
            flex="1"
          />
          <Button
            colorScheme="purple"
            onClick={handleSubmit}
            isDisabled={!input.trim() || isLoading}
            borderRadius="md"
            size={isMobile ? "md" : "lg"}
            leftIcon={<FiSend />}
            display="flex"
            alignItems="center"
            justifyContent="flex-start"
            pl={1}
            pr={2}
            transition="all 0.3s"
            _hover={!input.trim() || isLoading ? {} : buttonHoverStyle}
          >
            Send
          </Button>
          </HStack>
        </VStack>
      </VStack>

      <Box mt={8} p={isMobile ? 3 : 4} borderRadius="md" bg="rgba(0, 0, 0, 0.2)">
        <Heading size="sm" mb={2} color="#4A5568" fontSize={isMobile ? "xs" : "sm"}>About AI Assistant</Heading>
        {aiPowerMode ? (
          <>
            <Text fontSize={isMobile ? "xs" : "sm"} color="#4A5568" wordBreak="normal" overflowWrap="break-word" whiteSpace="pre-wrap" maxWidth="100%" overflow="visible">
              In Super Power mode, the AI Assistant can help with a wide range of tasks beyond the Meta ART platform.
              Ask questions on any topic, request code examples, or get help with planning and organization.
            </Text>
            <Flex mt={2} mb={2} flexWrap="wrap" gap={2}>
              <Badge colorScheme="green" fontSize={isMobile ? "xs" : "sm"}>Information</Badge>
              <Badge colorScheme="blue" fontSize={isMobile ? "xs" : "sm"}>Code</Badge>
              <Badge colorScheme="purple" fontSize={isMobile ? "xs" : "sm"}>Planning</Badge>
              <Badge colorScheme="teal" fontSize={isMobile ? "xs" : "sm"}>Assistance</Badge>
            </Flex>

            {/* Информация о текущей модели */}
            <Flex mt={2} alignItems="center" bg="rgba(0, 0, 0, 0.1)" p={2} borderRadius="md">
              <Text fontSize={isMobile ? "xs" : "sm"} color="#4A5568" fontWeight="medium">
                Current model:
              </Text>
              <Badge ml={2} colorScheme="teal" fontSize={isMobile ? "xs" : "sm"}>
                {Object.values(OPENROUTER_MODELS).find(model => model.id === selectedModel)?.name || 'Default'}
              </Badge>

              {fallbackModels && fallbackModels.length > 0 && (
                <Tooltip label={`Fallback models: ${fallbackModels.map(id =>
                  Object.values(OPENROUTER_MODELS).find(model => model.id === id)?.name
                ).join(', ')}`}>
                  <Badge ml={2} colorScheme="blue" fontSize={isMobile ? "xs" : "sm"}>
                    +{fallbackModels.length} fallbacks
                  </Badge>
                </Tooltip>
              )}

              {selectedPreset !== 'custom' && (
                <Badge ml={2} colorScheme="purple" fontSize={isMobile ? "xs" : "sm"}>
                  {MODEL_PRESETS[selectedPreset]?.name || 'Custom'} preset
                </Badge>
              )}
            </Flex>
          </>
        ) : (
          <>
            <Text fontSize={isMobile ? "xs" : "sm"} color="#4A5568" wordBreak="normal" overflowWrap="break-word" whiteSpace="pre-wrap" maxWidth="100%" overflow="visible">
              The Meta ART AI Assistant can help you with information about the platform, NFTs, auctions, staking, and rewards.
              Click on a topic button to learn more, or ask any question about the platform.
            </Text>
            <Flex mt={2} flexWrap="wrap" gap={2}>
              <Badge colorScheme="purple" fontSize={isMobile ? "xs" : "sm"}>NFTs</Badge>
              <Badge colorScheme="teal" fontSize={isMobile ? "xs" : "sm"}>Auctions</Badge>
              <Badge colorScheme="blue" fontSize={isMobile ? "xs" : "sm"}>Staking</Badge>
              <Badge colorScheme="green" fontSize={isMobile ? "xs" : "sm"}>Rewards</Badge>
            </Flex>
          </>
        )}
      </Box>
    </Box>
  );
};

export default AIAgent;
