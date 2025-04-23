// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NFTMarketplace
 * @dev A simple NFT marketplace contract that allows users to list, buy, and withdraw NFTs
 */
contract NFTMarketplace is ERC721Holder, Ownable, ReentrancyGuard {
    // Комиссии (в процентах, умноженных на 100 для точности)
    uint256 public transactionFee = 500; // 5%
    uint256 public mintingFee = 500; // 5%
    uint256 public stakingFee = 500; // 5%
    uint256 public constant FEE_DENOMINATOR = 10000; // 100%

    // Адрес для сбора комиссий
    address public feeCollector;

    // Адрес токена ART для стейкинга
    address public artToken;
    // Структура для хранения информации о листинге NFT
    struct Listing {
        address seller;
        uint256 price;
        bool active;
        bool isAuction;
        uint256 auctionEndTime;
        address highestBidder;
        uint256 highestBid;
    }

    // Структура для хранения информации о ставке в аукционе
    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    // Маппинг для хранения листингов: адрес контракта NFT => ID токена => информация о листинге
    mapping(address => mapping(uint256 => Listing)) public listings;

    // Маппинг для хранения NFT, которые были отправлены напрямую (не через листинг)
    mapping(address => mapping(uint256 => address)) public directDeposits;

    // Маппинг для хранения истории ставок в аукционе: адрес контракта NFT => ID токена => индекс ставки => информация о ставке
    mapping(address => mapping(uint256 => mapping(uint256 => Bid))) public auctionBids;

    // Маппинг для хранения количества ставок в аукционе: адрес контракта NFT => ID токена => количество ставок
    mapping(address => mapping(uint256 => uint256)) public bidCounts;

    // События
    event NFTListed(address indexed nftContract, uint256 indexed tokenId, uint256 price, address indexed seller);
    event NFTSold(address indexed nftContract, uint256 indexed tokenId, uint256 price, address seller, address buyer);
    event NFTWithdrawn(address indexed nftContract, uint256 indexed tokenId, address indexed owner);
    event NFTDirectDeposited(address indexed nftContract, uint256 indexed tokenId, address indexed depositor);
    event PriceChanged(address indexed nftContract, uint256 indexed tokenId, uint256 newPrice);
    event FeeCollected(address indexed collector, uint256 amount, string feeType);
    event FeeUpdated(string feeType, uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address oldCollector, address newCollector);
    event ArtTokenUpdated(address oldToken, address newToken);

    // События для аукциона
    event AuctionCreated(address indexed nftContract, uint256 indexed tokenId, uint256 startPrice, uint256 endTime, address indexed seller);
    event BidPlaced(address indexed nftContract, uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionEnded(address indexed nftContract, uint256 indexed tokenId, address winner, uint256 amount);
    event AuctionCancelled(address indexed nftContract, uint256 indexed tokenId, address indexed seller);

    /**
     * @dev Конструктор
     * @param _feeCollector Адрес для сбора комиссий
     * @param _artToken Адрес токена ART
     */
    constructor(address _feeCollector, address _artToken) {
        require(_feeCollector != address(0), "Fee collector cannot be zero address");
        feeCollector = _feeCollector;
        artToken = _artToken;

        // Передаем права владельца адресу сборщика комиссий
        if (_feeCollector != msg.sender) {
            transferOwnership(_feeCollector);
        }
    }

    /**
     * @dev Установка комиссии за транзакции
     * @param _fee Новая комиссия (в процентах * 100)
     */
    function setTransactionFee(uint256 _fee) external onlyOwner {
        require(_fee <= 2000, "Fee cannot exceed 20%");
        uint256 oldFee = transactionFee;
        transactionFee = _fee;
        emit FeeUpdated("transaction", oldFee, _fee);
    }

    /**
     * @dev Установка комиссии за минтинг
     * @param _fee Новая комиссия (в процентах * 100)
     */
    function setMintingFee(uint256 _fee) external onlyOwner {
        require(_fee <= 2000, "Fee cannot exceed 20%");
        uint256 oldFee = mintingFee;
        mintingFee = _fee;
        emit FeeUpdated("minting", oldFee, _fee);
    }

    /**
     * @dev Установка комиссии за стейкинг
     * @param _fee Новая комиссия (в процентах * 100)
     */
    function setStakingFee(uint256 _fee) external onlyOwner {
        require(_fee <= 2000, "Fee cannot exceed 20%");
        uint256 oldFee = stakingFee;
        stakingFee = _fee;
        emit FeeUpdated("staking", oldFee, _fee);
    }

    /**
     * @dev Установка адреса для сбора комиссий
     * @param _feeCollector Новый адрес для сбора комиссий
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Fee collector cannot be zero address");
        address oldCollector = feeCollector;
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(oldCollector, _feeCollector);
    }

    /**
     * @dev Установка адреса токена ART
     * @param _artToken Новый адрес токена ART
     */
    function setArtToken(address _artToken) external onlyOwner {
        address oldToken = artToken;
        artToken = _artToken;
        emit ArtTokenUpdated(oldToken, _artToken);
    }

    /**
     * @dev Расчет комиссии
     * @param _amount Сумма, с которой взимается комиссия
     * @param _feePercentage Процент комиссии
     * @return Сумма комиссии
     */
    function calculateFee(uint256 _amount, uint256 _feePercentage) internal pure returns (uint256) {
        return (_amount * _feePercentage) / FEE_DENOMINATOR;
    }

    /**
     * @dev Листинг NFT на маркетплейсе для продажи
     * @param _nftContract Адрес контракта NFT
     * @param _tokenId ID токена NFT
     * @param _price Цена NFT в wei
     */
    function listNFT(address _nftContract, uint256 _tokenId, uint256 _price) external nonReentrant {
        require(_price > 0, "Price must be greater than zero");

        // Передаем NFT от пользователя на контракт маркетплейса
        IERC721(_nftContract).safeTransferFrom(msg.sender, address(this), _tokenId);

        // Создаем листинг
        listings[_nftContract][_tokenId] = Listing({
            seller: msg.sender,
            price: _price,
            active: true,
            isAuction: false,
            auctionEndTime: 0,
            highestBidder: address(0),
            highestBid: 0
        });

        emit NFTListed(_nftContract, _tokenId, _price, msg.sender);
    }

    /**
     * @dev Создание аукциона для NFT
     * @param _nftContract Адрес контракта NFT
     * @param _tokenId ID токена NFT
     * @param _startPrice Начальная цена аукциона в wei
     * @param _duration Продолжительность аукциона в секундах
     */
    function createAuction(address _nftContract, uint256 _tokenId, uint256 _startPrice, uint256 _duration) external nonReentrant {
        require(_startPrice > 0, "Start price must be greater than zero");
        require(_duration >= 1 hours, "Auction duration must be at least 1 hour");
        require(_duration <= 7 days, "Auction duration cannot exceed 7 days");

        // Передаем NFT от пользователя на контракт маркетплейса
        IERC721(_nftContract).safeTransferFrom(msg.sender, address(this), _tokenId);

        // Вычисляем время окончания аукциона
        uint256 endTime = block.timestamp + _duration;

        // Создаем аукцион
        listings[_nftContract][_tokenId] = Listing({
            seller: msg.sender,
            price: _startPrice,
            active: true,
            isAuction: true,
            auctionEndTime: endTime,
            highestBidder: address(0),
            highestBid: 0
        });

        // Сбрасываем счетчик ставок
        bidCounts[_nftContract][_tokenId] = 0;

        emit AuctionCreated(_nftContract, _tokenId, _startPrice, endTime, msg.sender);
    }

    /**
     * @dev Размещение ставки в аукционе
     * @param _nftContract Адрес контракта NFT
     * @param _tokenId ID токена NFT
     */
    function placeBid(address _nftContract, uint256 _tokenId) external payable nonReentrant {
        Listing storage listing = listings[_nftContract][_tokenId];

        require(listing.active, "Auction not active");
        require(listing.isAuction, "Not an auction");
        require(block.timestamp < listing.auctionEndTime, "Auction has ended");
        require(msg.sender != listing.seller, "Seller cannot bid");

        // Минимальная ставка: начальная цена или текущая высшая ставка + 5%
        uint256 minBid = listing.highestBid > 0
            ? listing.highestBid + (listing.highestBid * 5 / 100) // +5% от текущей высшей ставки
            : listing.price;

        require(msg.value >= minBid, "Bid too low");

        // Возвращаем предыдущую ставку предыдущему участнику
        if (listing.highestBidder != address(0)) {
            payable(listing.highestBidder).transfer(listing.highestBid);
        }

        // Обновляем информацию о высшей ставке
        listing.highestBidder = msg.sender;
        listing.highestBid = msg.value;

        // Сохраняем информацию о ставке в истории
        uint256 bidIndex = bidCounts[_nftContract][_tokenId];
        auctionBids[_nftContract][_tokenId][bidIndex] = Bid({
            bidder: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        });
        bidCounts[_nftContract][_tokenId] = bidIndex + 1;

        // Продлеваем аукцион на 5 минут, если ставка сделана в последние 5 минут
        if (listing.auctionEndTime - block.timestamp < 5 minutes) {
            listing.auctionEndTime += 5 minutes;
        }

        emit BidPlaced(_nftContract, _tokenId, msg.sender, msg.value);
    }

    /**
     * @dev Покупка NFT с маркетплейса
     * @param _nftContract Адрес контракта NFT
     * @param _tokenId ID токена NFT
     */
    function buyNFT(address _nftContract, uint256 _tokenId) external payable nonReentrant {
        Listing storage listing = listings[_nftContract][_tokenId];

        require(listing.active, "NFT not listed for sale");
        require(!listing.isAuction, "NFT is in auction");
        require(msg.value >= listing.price, "Insufficient payment");

        // Отмечаем листинг как неактивный
        listing.active = false;

        // Рассчитываем комиссию за транзакцию (5%)
        uint256 fee = calculateFee(msg.value, transactionFee);
        uint256 sellerAmount = msg.value - fee;

        // Отправляем деньги продавцу (за вычетом комиссии)
        payable(listing.seller).transfer(sellerAmount);

        // Отправляем комиссию на адрес сборщика комиссий
        if (fee > 0) {
            payable(feeCollector).transfer(fee);
            emit FeeCollected(feeCollector, fee, "transaction");
        }

        // Передаем NFT покупателю
        IERC721(_nftContract).safeTransferFrom(address(this), msg.sender, _tokenId);

        emit NFTSold(_nftContract, _tokenId, listing.price, listing.seller, msg.sender);
    }

    /**
     * @dev Завершение аукциона
     * @param _nftContract Адрес контракта NFT
     * @param _tokenId ID токена NFT
     */
    function endAuction(address _nftContract, uint256 _tokenId) external nonReentrant {
        Listing storage listing = listings[_nftContract][_tokenId];

        require(listing.active, "Auction not active");
        require(listing.isAuction, "Not an auction");
        require(block.timestamp >= listing.auctionEndTime || msg.sender == listing.seller, "Auction not ended yet");

        // Отмечаем аукцион как неактивный
        listing.active = false;

        // Если есть высшая ставка, завершаем аукцион с победителем
        if (listing.highestBidder != address(0)) {
            // Рассчитываем комиссию за транзакцию (5%)
            uint256 fee = calculateFee(listing.highestBid, transactionFee);
            uint256 sellerAmount = listing.highestBid - fee;

            // Отправляем деньги продавцу (за вычетом комиссии)
            payable(listing.seller).transfer(sellerAmount);

            // Отправляем комиссию на адрес сборщика комиссий
            if (fee > 0) {
                payable(feeCollector).transfer(fee);
                emit FeeCollected(feeCollector, fee, "transaction");
            }

            // Передаем NFT победителю аукциона
            IERC721(_nftContract).safeTransferFrom(address(this), listing.highestBidder, _tokenId);

            emit AuctionEnded(_nftContract, _tokenId, listing.highestBidder, listing.highestBid);
        } else {
            // Если нет ставок, возвращаем NFT продавцу
            IERC721(_nftContract).safeTransferFrom(address(this), listing.seller, _tokenId);

            emit AuctionCancelled(_nftContract, _tokenId, listing.seller);
        }
    }

    /**
     * @dev Отмена аукциона (только если нет ставок)
     * @param _nftContract Адрес контракта NFT
     * @param _tokenId ID токена NFT
     */
    function cancelAuction(address _nftContract, uint256 _tokenId) external nonReentrant {
        Listing storage listing = listings[_nftContract][_tokenId];

        require(listing.active, "Auction not active");
        require(listing.isAuction, "Not an auction");
        require(msg.sender == listing.seller, "Not the seller");
        require(listing.highestBidder == address(0), "Cannot cancel auction with bids");

        // Отмечаем аукцион как неактивный
        listing.active = false;

        // Возвращаем NFT продавцу
        IERC721(_nftContract).safeTransferFrom(address(this), listing.seller, _tokenId);

        emit AuctionCancelled(_nftContract, _tokenId, listing.seller);
    }

    /**
     * @dev Отмена листинга и возврат NFT владельцу
     * @param _nftContract Адрес контракта NFT
     * @param _tokenId ID токена NFT
     */
    function withdrawNFT(address _nftContract, uint256 _tokenId) external nonReentrant {
        Listing storage listing = listings[_nftContract][_tokenId];

        require(listing.seller == msg.sender, "Not the seller");
        require(listing.active, "NFT not listed or already sold");

        // Отмечаем листинг как неактивный
        listing.active = false;

        // Возвращаем NFT владельцу
        IERC721(_nftContract).safeTransferFrom(address(this), msg.sender, _tokenId);

        emit NFTWithdrawn(_nftContract, _tokenId, msg.sender);
    }

    /**
     * @dev Изменение цены листинга
     * @param _nftContract Адрес контракта NFT
     * @param _tokenId ID токена NFT
     * @param _newPrice Новая цена NFT в wei
     */
    function changePrice(address _nftContract, uint256 _tokenId, uint256 _newPrice) external nonReentrant {
        Listing storage listing = listings[_nftContract][_tokenId];

        require(listing.seller == msg.sender, "Not the seller");
        require(listing.active, "NFT not listed or already sold");
        require(_newPrice > 0, "Price must be greater than zero");

        listing.price = _newPrice;

        emit PriceChanged(_nftContract, _tokenId, _newPrice);
    }

    /**
     * @dev Обработка прямых депозитов NFT (без листинга)
     * @param _operator Адрес оператора, который отправил NFT
     * @param _from Адрес отправителя NFT
     * @param _tokenId ID токена NFT
     * @param _data Дополнительные данные
     */
    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes memory _data
    ) public override returns (bytes4) {
        // Если NFT был отправлен не через функцию listNFT, сохраняем информацию о депозите
        if (_operator != address(this)) {
            directDeposits[msg.sender][_tokenId] = _from;
            emit NFTDirectDeposited(msg.sender, _tokenId, _from);
        }

        return super.onERC721Received(_operator, _from, _tokenId, _data);
    }

    /**
     * @dev Получение списка всех активных листингов
     * @param _nftContract Адрес контракта NFT
     * @param _tokenIds Массив ID токенов NFT
     * @return sellers Массив адресов продавцов
     * @return prices Массив цен
     * @return activeFlags Массив флагов активности
     */
    function getListings(
        address _nftContract,
        uint256[] calldata _tokenIds
    ) external view returns (
        address[] memory sellers,
        uint256[] memory prices,
        bool[] memory activeFlags
    ) {
        uint256 length = _tokenIds.length;
        sellers = new address[](length);
        prices = new uint256[](length);
        activeFlags = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            Listing storage listing = listings[_nftContract][_tokenIds[i]];
            sellers[i] = listing.seller;
            prices[i] = listing.price;
            activeFlags[i] = listing.active;
        }

        return (sellers, prices, activeFlags);
    }

    /**
     * @dev Минтинг NFT с комиссией
     * @param _nftContract Адрес контракта NFT
     * @param _tokenURI URI метаданных для нового NFT
     */
    function mintNFT(address _nftContract, string calldata _tokenURI) external payable nonReentrant {
        // Рассчитываем комиссию за минтинг
        uint256 fee = calculateFee(msg.value, mintingFee);
        require(msg.value >= fee, "Insufficient payment for minting fee");

        // Отправляем комиссию на адрес сборщика комиссий
        if (fee > 0) {
            payable(feeCollector).transfer(fee);
            emit FeeCollected(feeCollector, fee, "minting");
        }

        // Возвращаем излишек отправителю
        uint256 excess = msg.value - fee;
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }

        // Вызываем функцию минтинга в контракте NFT
        // Предполагается, что контракт NFT имеет функцию mint
        // С интерфейсом: function mint(address to, string memory tokenURI) external returns (uint256)
        bytes memory data = abi.encodeWithSignature("mint(address,string)", msg.sender, _tokenURI);
        (bool success, bytes memory returnData) = _nftContract.call(data);
        require(success, "Minting failed");

        // Получаем ID нового токена из возвращаемых данных
        uint256 tokenId = 0;
        if (returnData.length > 0) {
            tokenId = abi.decode(returnData, (uint256));
        }

        // Событие минтинга NFT
        emit NFTListed(_nftContract, tokenId, 0, msg.sender);
    }

    /**
     * @dev Стейкинг NFT с комиссией
     * @param _nftContract Адрес контракта NFT
     * @param _tokenId ID токена NFT
     * @param _duration Продолжительность стейкинга в секундах
     */
    function stakeNFT(address _nftContract, uint256 _tokenId, uint256 _duration) external payable nonReentrant {
        // Проверяем, что отправитель является владельцем NFT
        require(IERC721(_nftContract).ownerOf(_tokenId) == msg.sender, "Not the owner of NFT");

        // Рассчитываем комиссию за стейкинг
        uint256 fee = calculateFee(msg.value, stakingFee);
        require(msg.value >= fee, "Insufficient payment for staking fee");

        // Отправляем комиссию на адрес сборщика комиссий
        if (fee > 0) {
            payable(feeCollector).transfer(fee);
            emit FeeCollected(feeCollector, fee, "staking");
        }

        // Возвращаем излишек отправителю
        uint256 excess = msg.value - fee;
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }

        // Передаем NFT от пользователя на контракт маркетплейса
        IERC721(_nftContract).safeTransferFrom(msg.sender, address(this), _tokenId);

        // Запускаем стейкинг и начисляем токены ART
        // Предполагается, что токен ART имеет функцию mint
        // С интерфейсом: function mint(address to, uint256 amount) external

        // Рассчитываем награду за стейкинг
        // 10 токенов за первый час + 10 за каждый последующий час
        uint256 hoursStaked = _duration / 3600;
        uint256 reward = 0;
        for (uint256 i = 1; i <= hoursStaked; i++) {
            reward += i * 10 * 10**18; // 10 токенов * i часов * 10^18 (для 18 десятичных знаков)
        }

        // Минтим токены ART пользователю
        if (artToken != address(0) && reward > 0) {
            bytes memory data = abi.encodeWithSignature("mint(address,uint256)", msg.sender, reward);
            (bool success, ) = artToken.call(data);
            require(success, "ART token minting failed");
        }

        // Сохраняем информацию о стейкинге
        directDeposits[_nftContract][_tokenId] = msg.sender;

        // Событие стейкинга NFT
        emit NFTDirectDeposited(_nftContract, _tokenId, msg.sender);
    }

    /**
     * @dev Получение информации о прямом депозите
     * @param _nftContract Адрес контракта NFT
     * @param _tokenId ID токена NFT
     * @return depositor Адрес отправителя
     */
    function getDirectDeposit(
        address _nftContract,
        uint256 _tokenId
    ) external view returns (address depositor) {
        return directDeposits[_nftContract][_tokenId];
    }

    /**
     * @dev Возврат NFT, отправленного напрямую
     * @param _nftContract Адрес контракта NFT
     * @param _tokenId ID токена NFT
     */
    function withdrawDirectDeposit(address _nftContract, uint256 _tokenId) external nonReentrant {
        address depositor = directDeposits[_nftContract][_tokenId];
        require(depositor == msg.sender, "Not the depositor");

        // Удаляем информацию о депозите
        delete directDeposits[_nftContract][_tokenId];

        // Возвращаем NFT отправителю
        IERC721(_nftContract).safeTransferFrom(address(this), msg.sender, _tokenId);

        emit NFTWithdrawn(_nftContract, _tokenId, msg.sender);
    }

    /**
     * @dev Листинг NFT, отправленного напрямую
     * @param _nftContract Адрес контракта NFT
     * @param _tokenId ID токена NFT
     * @param _price Цена NFT в wei
     */
    function listDirectDeposit(address _nftContract, uint256 _tokenId, uint256 _price) external nonReentrant {
        address depositor = directDeposits[_nftContract][_tokenId];
        require(depositor == msg.sender, "Not the depositor");
        require(_price > 0, "Price must be greater than zero");

        // Удаляем информацию о депозите
        delete directDeposits[_nftContract][_tokenId];

        // Создаем листинг
        listings[_nftContract][_tokenId] = Listing({
            seller: msg.sender,
            price: _price,
            active: true,
            isAuction: false,
            auctionEndTime: 0,
            highestBidder: address(0),
            highestBid: 0
        });

        emit NFTListed(_nftContract, _tokenId, _price, msg.sender);
    }

    /**
     * @dev Функция для администратора, позволяют выставить на продажу NFT, который находится на маркетплейсе
     * @param _nftContract Адрес контракта NFT
     * @param _tokenId ID токена NFT
     * @param _price Цена NFT в wei
     * @param _seller Адрес продавца
     */
    function adminListNFT(address _nftContract, uint256 _tokenId, uint256 _price, address _seller) external onlyOwner {
        require(_price > 0, "Price must be greater than zero");
        require(_seller != address(0), "Seller cannot be zero address");

        // Проверяем, что NFT находится на маркетплейсе
        require(IERC721(_nftContract).ownerOf(_tokenId) == address(this), "NFT not on marketplace");

        // Создаем листинг
        listings[_nftContract][_tokenId] = Listing({
            seller: _seller,
            price: _price,
            active: true,
            isAuction: false,
            auctionEndTime: 0,
            highestBidder: address(0),
            highestBid: 0
        });

        emit NFTListed(_nftContract, _tokenId, _price, _seller);
    }

    /**
     * @dev Функция для администратора, позволяют передать NFT на другой адрес
     * @param _nftContract Адрес контракта NFT
     * @param _tokenId ID токена NFT
     * @param _to Адрес получателя
     */
    function transferNFT(address _nftContract, uint256 _tokenId, address _to) external onlyOwner {
        // Проверяем, что NFT находится на маркетплейсе
        require(IERC721(_nftContract).ownerOf(_tokenId) == address(this), "NFT not on marketplace");

        // Удаляем информацию о депозите, если она есть
        delete directDeposits[_nftContract][_tokenId];

        // Удаляем информацию о листинге, если она есть
        delete listings[_nftContract][_tokenId];

        // Передаем NFT на указанный адрес
        IERC721(_nftContract).safeTransferFrom(address(this), _to, _tokenId);

        emit NFTWithdrawn(_nftContract, _tokenId, _to);
    }

    /**
     * @dev Функция для администратора, позволяют установить владельца депозита для NFT
     * @param _nftContract Адрес контракта NFT
     * @param _tokenId ID токена NFT
     * @param _depositor Адрес владельца депозита
     */
    function setDirectDeposit(address _nftContract, uint256 _tokenId, address _depositor) external onlyOwner {
        // Проверяем, что NFT находится на маркетплейсе
        require(IERC721(_nftContract).ownerOf(_tokenId) == address(this), "NFT not on marketplace");

        // Устанавливаем владельца депозита
        directDeposits[_nftContract][_tokenId] = _depositor;

        emit NFTDirectDeposited(_nftContract, _tokenId, _depositor);
    }
}
