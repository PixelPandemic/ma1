import { useState, useEffect } from 'react';
import { ChakraProvider, Box, Button, Center, VStack, useMediaQuery, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Text, Checkbox, Heading, UnorderedList, ListItem, useDisclosure } from '@chakra-ui/react';
import SimpleWalletConnector from './components/SimpleWalletConnector';
import NFTMarketplace from './components/NFTMarketplace';

// Импортируем глобальные стили для предотвращения мигания
import './styles/global.css';
// Импортируем адаптивные стили для мультиплатформенности
import './styles/responsive.css';
// Импортируем стили для всплывающих окон и уведомлений
import './styles/notifications.css';

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [showMainContent, setShowMainContent] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();



  // Определяем размер экрана и ориентацию
  useEffect(() => {
    // Функция для определения размера экрана
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 576);
      setIsTablet(window.innerWidth > 576 && window.innerWidth <= 991);
      setIsLandscape(window.innerWidth > window.innerHeight);

      // Добавляем класс для десктопов
      if (window.innerWidth >= 992) {
        document.body.classList.add('desktop-view');
      } else {
        document.body.classList.remove('desktop-view');
      }
    };

    // Вызываем функцию при загрузке
    handleResize();

    // Добавляем обработчик события resize
    window.addEventListener('resize', handleResize);

    // Удаляем обработчик при размонтировании
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('desktop-view');
    };
  }, []);

  // Spline Viewer теперь загружается через тег script в index.html

  // Дополнительный useEffect для скрытия надписи "Built with Spline"
  useEffect(() => {
    // Функция для скрытия надписи
    const hideSplineFooter = () => {
      // Попытка найти и скрыть все возможные элементы
      const splineViewer = document.querySelector('spline-viewer');
      if (splineViewer && splineViewer.shadowRoot) {
        const shadowElements = splineViewer.shadowRoot.querySelectorAll('a, div[class*="lib"], div[class*="footer"], div[class*="bottom"]');
        shadowElements.forEach(el => {
          el.style.display = 'none';
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          el.style.pointerEvents = 'none';
          el.style.height = '0';
          el.style.width = '0';
          el.style.position = 'absolute';
          el.style.bottom = '-9999px';
        });
      }
    };

    // Вызываем функцию сразу и с задержкой
    hideSplineFooter();
    const timers = [
      setTimeout(hideSplineFooter, 500),
      setTimeout(hideSplineFooter, 1000),
      setTimeout(hideSplineFooter, 2000),
      setTimeout(hideSplineFooter, 3000),
      setTimeout(hideSplineFooter, 5000)
    ];

    // Также добавляем наблюдатель за изменениями в DOM
    const observer = new MutationObserver(() => {
      hideSplineFooter();
    });

    // Начинаем наблюдение за изменениями в DOM
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      // Очищаем таймеры и останавливаем наблюдатель
      timers.forEach(timer => clearTimeout(timer));
      observer.disconnect();
    };
  }, []);

  // Функция для перехода на основной сайт
  const handleEnterSite = () => {
    onOpen(); // Открываем модальное окно с дисклеймером
  };

  // Функция для подтверждения согласия с условиями
  const handleAgree = () => {
    setIsAgreed(true);
    onClose();
    setShowMainContent(true);
  };

  return (
    <ChakraProvider>
      {/* Модальное окно с дисклеймером */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="rgba(0, 0, 0, 0.8)" color="white" borderRadius="md" p={4}>
          <ModalHeader fontSize="2xl" textAlign="center">Terms of Use & Disclaimer</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="start">
              <Heading size="md">Risk Disclaimer</Heading>
              <Text>
                By using the Meta ART NFT Marketplace, you acknowledge and agree that:
              </Text>
              <UnorderedList spacing={2} pl={4}>
                <ListItem>Cryptocurrency and NFT transactions involve significant risk and volatility.</ListItem>
                <ListItem>The value of NFTs and cryptocurrencies can fluctuate dramatically and may result in partial or total loss of your investment.</ListItem>
                <ListItem>Past performance is not indicative of future results.</ListItem>
                <ListItem>You are solely responsible for your investment decisions and should conduct your own research before buying, selling, or staking NFTs.</ListItem>
                <ListItem>Blockchain transactions are irreversible. Once completed, they cannot be undone.</ListItem>
              </UnorderedList>

              <Heading size="md">Platform Disclaimer</Heading>
              <Text>
                Meta ART NFT Marketplace:
              </Text>
              <UnorderedList spacing={2} pl={4}>
                <ListItem>Is provided "as is" without warranties of any kind, either express or implied.</ListItem>
                <ListItem>Does not guarantee the accuracy, completeness, or timeliness of information on the platform.</ListItem>
                <ListItem>Is not responsible for any losses, damages, or other liabilities related to your use of the platform.</ListItem>
                <ListItem>May experience downtime, delays, or technical issues that could affect transactions.</ListItem>
                <ListItem>Reserves the right to modify, suspend, or discontinue any aspect of the service at any time.</ListItem>
              </UnorderedList>

              <Heading size="md">Legal Compliance</Heading>
              <Text>
                You agree to:
              </Text>
              <UnorderedList spacing={2} pl={4}>
                <ListItem>Comply with all applicable laws and regulations in your jurisdiction.</ListItem>
                <ListItem>Not use the platform for any illegal activities, including money laundering, fraud, or tax evasion.</ListItem>
                <ListItem>Be solely responsible for any tax obligations arising from your transactions on the platform.</ListItem>
              </UnorderedList>

              <Checkbox
                size="lg"
                colorScheme="purple"
                mt={4}
                isChecked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
              >
                <Text fontWeight="bold">I have read, understood, and agree to the terms and conditions outlined above.</Text>
              </Checkbox>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="purple"
              mr={3}
              onClick={handleAgree}
              isDisabled={!isAgreed}
              size="lg"
              width="full"
            >
              I Agree & Continue
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Контейнер для Spline на весь фон */}
      <Box
        position="fixed"
        top="0"
        left="0"
        width="100vw"
        height="100vh"
        zIndex="-1"
        className="spline-container"
      >
        {/* Используем точно такой же тег spline-viewer, как в вашем коде */}
        <spline-viewer
          url="https://prod.spline.design/l8Gru0PprpL3vcuc/scene.splinecode"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
            overflow: 'hidden'
          }}
          onError={(e) => console.log('Spline loading error:', e)}
          loading-status="lazy"
        ></spline-viewer>
        {/* Дополнительный перекрывающий элемент для нижней части */}
        <Box
          position="absolute"
          bottom="0"
          left="0"
          right="0"
          height={isMobile ? "50px" : "30px"}
          background="linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)"
          zIndex="9999"
        />
      </Box>

      {!showMainContent ? (
        // Страница входа с кнопкой
        <Center height="100vh" className="ios-fix android-fix" overflow="hidden">
          <VStack spacing={isMobile ? 4 : 8} className="responsive-container">
            <Box
              className="title-container"
              mb={isMobile ? 5 : 10}
              textAlign="center"
            >
              <div className="title-wrapper">
                <h1 className="gradient-text" style={{
                  fontSize: isMobile ? '3rem' : isTablet ? '4rem' : '5rem',
                  lineHeight: isMobile && isLandscape ? '1' : '1.2'
                }}>Meta ART</h1>
                <div className="subtitle" style={{
                  fontSize: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem',
                  marginTop: isMobile && isLandscape ? '0' : '2px'
                }}>
                  <span>N</span>
                  <span>F</span>
                  <span>T</span>
                  <span> </span>
                  <span>M</span>
                  <span>A</span>
                  <span>R</span>
                  <span>K</span>
                  <span>E</span>
                  <span>T</span>
                  <span>P</span>
                  <span>L</span>
                  <span>A</span>
                  <span>C</span>
                  <span>E</span>
                </div>
              </div>
            </Box>
            <Button
              onClick={handleEnterSite}
              size={isMobile ? "md" : "lg"}
              colorScheme="purple"
              px={isMobile ? 6 : 10}
              py={isMobile ? 6 : 8}
              fontSize={isMobile ? "lg" : "xl"}
              borderRadius="full"
              bgGradient="linear(to-r, purple.500, pink.500)"
              _hover={{
                bgGradient: "linear(to-r, purple.600, pink.600)",
                boxShadow: "xl"
              }}

              className="responsive-button"
            >
              Visit Site
            </Button>
          </VStack>
        </Center>
      ) : (
        // Основной контент сайта
        <Box
          className="ios-fix android-fix main-container"
          overflow="visible"
          width="100%"
          height="auto"
          minHeight="100vh"
          position="relative"
          display="flex"
          flexDirection="column"
          margin="0"
          padding="0"
        >
          <Box
            as="header"
            width="full"
            p={isMobile ? 2 : isTablet ? 3 : 4}
            bg="rgba(76, 29, 149, 0.8)"
            backdropFilter="blur(10px)"
            color="white"
            boxShadow="0 4px 30px rgba(0, 0, 0, 0.1)"
            position="fixed"
            top="0"
            left="0"
            right="0"
            zIndex="95" /* Уменьшаем z-index, чтобы всплывающие окна были поверх */
          >
            <Box
              maxW={isMobile ? "100%" : isTablet ? "95%" : "1200px"}
              mx="auto"
              display="flex"
              flexDirection={isMobile ? "column" : "row"}
              alignItems="center"
              justifyContent={isMobile ? "center" : "space-between"}
              className="responsive-container"
              py={isMobile ? 1 : 2}
            >
              <div className="title-container">
                <div className="title-wrapper">
                  <h1 className="gradient-text" style={{
                    fontSize: isMobile ? '1.8rem' : isTablet ? '2.2rem' : '2.5rem'
                  }}>Meta ART</h1>
                  <div className="subtitle" style={{
                    fontSize: isMobile ? '0.5rem' : isTablet ? '0.6rem' : '0.65rem'
                  }}>
                    <span>N</span>
                    <span>F</span>
                    <span>T</span>
                    <span> </span>
                    <span>M</span>
                    <span>A</span>
                    <span>R</span>
                    <span>K</span>
                    <span>E</span>
                    <span>T</span>
                    <span>P</span>
                    <span>L</span>
                    <span>A</span>
                    <span>C</span>
                    <span>E</span>
                  </div>
                </div>
              </div>
              <Box ml={isMobile ? "0" : "auto"} mt={isMobile ? 4 : 0} position="relative">
                <SimpleWalletConnector setProvider={setProvider} setAccount={setAccount} />
              </Box>
            </Box>
          </Box>

          <Box
            className="responsive-container content-container"
            mx="auto"
            px={isMobile ? 2 : isTablet ? 3 : 4}
            py={isMobile ? 2 : isTablet ? 3 : 4}
            pb={isMobile ? 20 : 16} // Добавляем большой отступ снизу для предотвращения обрезания контента
            width="100%"
            flex="1"
            display="flex"
            flexDirection="column"
            position="relative"
            maxW={isMobile ? "100%" : isTablet ? "95%" : "1400px"}
            mt={isMobile ? "80px" : "70px"} // Добавляем отступ сверху для фиксированного заголовка
          >
            {provider && account ? (
              <Box
                width="100%"
                flex="1"
                display="flex"
                flexDirection="column"
                position="relative"
                mb={isMobile ? 16 : 12}
                height="auto"
                minHeight="70vh"
                overflowY="auto"
              >
                <NFTMarketplace provider={provider} account={account} />
              </Box>
            ) : (
              <Box
                textAlign="center"
                p={isMobile ? 5 : isTablet ? 8 : 10}
                bg="rgba(0, 0, 0, 0.8)"
                backdropFilter="blur(10px)"
                borderRadius={isMobile ? "lg" : "xl"}
                boxShadow="0 4px 30px rgba(0, 0, 0, 0.1)"
                mt={isMobile ? 2 : isTablet ? 4 : 6}
                mb={isMobile ? 4 : 5}
                className="card welcome-card"
                width="100%"
                flex="1"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
              >
                <h2 style={{
                  fontSize: isMobile ? '1.5rem' : isTablet ? '1.8rem' : '2rem',
                  marginBottom: isMobile ? '1rem' : '1.5rem',
                  color: '#4A5568'
                }}>NFT Auction with Staking Rewards</h2>
                <p style={{
                  fontSize: isMobile ? '1rem' : isTablet ? '1.1rem' : '1.25rem',
                  color: '#4A5568'
                }}>Connect your wallet to start minting and staking NFTs</p>
                <p style={{
                  fontSize: isMobile ? '0.9rem' : isTablet ? '1rem' : '1.1rem',
                  marginTop: '1rem',
                  color: '#4A5568'
                }}>Participate in our NFT auctions to buy unique digital assets or sell your NFTs to the highest bidder</p>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </ChakraProvider>
  );
}

export default App;