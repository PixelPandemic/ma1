// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title MetaArtMarketplace
 * @dev Contract for buying and selling NFTs
 */
contract MetaArtMarketplace is IERC721Receiver, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    
    // Fee percentage (5%)
    uint256 public constant FEE_PERCENTAGE = 5;
    
    // Fee collector address
    address public feeCollector;
    
    struct MarketItem {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address seller;
        address owner;
        uint256 price;
        bool sold;
    }
    
    // Mapping from item ID to MarketItem
    mapping(uint256 => MarketItem) public idToMarketItem;
    
    // Mapping from NFT contract address and token ID to item ID
    mapping(address => mapping(uint256 => uint256)) public nftToItemId;
    
    // Mapping from NFT contract address and token ID to depositor
    mapping(address => mapping(uint256 => address)) public directDeposits;
    
    // Events
    event MarketItemCreated(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );
    
    event NFTListed(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 price,
        address indexed seller
    );
    
    event NFTSold(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price
    );
    
    constructor(address _feeCollector) {
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Sets the fee collector address
     * @param _feeCollector New fee collector address
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Fee collector cannot be zero address");
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Gets the direct deposit for an NFT
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID of the NFT
     * @return depositor Address of the depositor
     */
    function getDirectDeposit(address _nftContract, uint256 _tokenId) external view returns (address) {
        return directDeposits[_nftContract][_tokenId];
    }
    
    /**
     * @dev Sets the direct deposit for an NFT
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID of the NFT
     * @param _depositor Address of the depositor
     */
    function setDirectDeposit(address _nftContract, uint256 _tokenId, address _depositor) external onlyOwner {
        directDeposits[_nftContract][_tokenId] = _depositor;
    }
    
    /**
     * @dev Withdraws an NFT from the marketplace
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID of the NFT
     */
    function withdrawNFT(address _nftContract, uint256 _tokenId) external nonReentrant {
        address depositor = directDeposits[_nftContract][_tokenId];
        require(depositor == msg.sender || depositor == address(0), "Only depositor can withdraw NFT");
        
        // Transfer NFT to depositor
        IERC721(_nftContract).transferFrom(address(this), msg.sender, _tokenId);
        
        // Remove direct deposit
        directDeposits[_nftContract][_tokenId] = address(0);
        
        // Remove market item if exists
        uint256 itemId = nftToItemId[_nftContract][_tokenId];
        if (itemId > 0) {
            delete idToMarketItem[itemId];
            nftToItemId[_nftContract][_tokenId] = 0;
        }
    }
    
    /**
     * @dev Lists an NFT for sale
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID of the NFT
     * @param _price Price of the NFT
     */
    function listNFT(address _nftContract, uint256 _tokenId, uint256 _price) external nonReentrant {
        require(_price > 0, "Price must be greater than zero");
        
        // Check if NFT is already in the marketplace
        require(IERC721(_nftContract).ownerOf(_tokenId) == msg.sender, "You don't own this NFT");
        
        // Transfer NFT to marketplace
        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);
        
        // Set direct deposit
        directDeposits[_nftContract][_tokenId] = msg.sender;
        
        // Create market item
        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        
        idToMarketItem[itemId] = MarketItem({
            itemId: itemId,
            nftContract: _nftContract,
            tokenId: _tokenId,
            seller: msg.sender,
            owner: address(this),
            price: _price,
            sold: false
        });
        
        nftToItemId[_nftContract][_tokenId] = itemId;
        
        emit MarketItemCreated(
            itemId,
            _nftContract,
            _tokenId,
            msg.sender,
            address(this),
            _price,
            false
        );
        
        emit NFTListed(
            _nftContract,
            _tokenId,
            _price,
            msg.sender
        );
    }
    
    /**
     * @dev Lists an NFT that is already in the marketplace
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID of the NFT
     * @param _price Price of the NFT
     */
    function listDirectDeposit(address _nftContract, uint256 _tokenId, uint256 _price) external nonReentrant {
        require(_price > 0, "Price must be greater than zero");
        
        // Check if NFT is in the marketplace
        require(IERC721(_nftContract).ownerOf(_tokenId) == address(this), "NFT not in marketplace");
        
        // Check if caller is the depositor
        address depositor = directDeposits[_nftContract][_tokenId];
        require(depositor == msg.sender || depositor == address(0), "Only depositor can list NFT");
        
        // Create market item
        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        
        idToMarketItem[itemId] = MarketItem({
            itemId: itemId,
            nftContract: _nftContract,
            tokenId: _tokenId,
            seller: msg.sender,
            owner: address(this),
            price: _price,
            sold: false
        });
        
        nftToItemId[_nftContract][_tokenId] = itemId;
        
        // Set direct deposit if not already set
        if (depositor == address(0)) {
            directDeposits[_nftContract][_tokenId] = msg.sender;
        }
        
        emit MarketItemCreated(
            itemId,
            _nftContract,
            _tokenId,
            msg.sender,
            address(this),
            _price,
            false
        );
        
        emit NFTListed(
            _nftContract,
            _tokenId,
            _price,
            msg.sender
        );
    }
    
    /**
     * @dev Buys an NFT from the marketplace
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID of the NFT
     */
    function buyNFT(address _nftContract, uint256 _tokenId) external payable nonReentrant {
        uint256 itemId = nftToItemId[_nftContract][_tokenId];
        require(itemId > 0, "Item not for sale");
        
        MarketItem storage item = idToMarketItem[itemId];
        require(!item.sold, "Item already sold");
        require(msg.value == item.price, "Incorrect price");
        require(msg.sender != item.seller, "Seller cannot buy their own item");
        
        // Calculate fee
        uint256 fee = (item.price * FEE_PERCENTAGE) / 100;
        uint256 sellerProceeds = item.price - fee;
        
        // Transfer NFT to buyer
        IERC721(_nftContract).transferFrom(address(this), msg.sender, _tokenId);
        
        // Transfer funds to seller and fee collector
        payable(item.seller).transfer(sellerProceeds);
        payable(feeCollector).transfer(fee);
        
        // Update item
        item.owner = msg.sender;
        item.sold = true;
        
        // Remove direct deposit
        directDeposits[_nftContract][_tokenId] = address(0);
        
        emit NFTSold(
            itemId,
            _nftContract,
            _tokenId,
            item.seller,
            msg.sender,
            item.price
        );
    }
    
    /**
     * @dev Gets all unsold market items
     * @return Array of unsold market items
     */
    function fetchMarketItems() external view returns (MarketItem[] memory) {
        uint256 itemCount = _itemIds.current();
        uint256 unsoldItemCount = 0;
        
        // Count unsold items
        for (uint256 i = 1; i <= itemCount; i++) {
            if (!idToMarketItem[i].sold) {
                unsoldItemCount++;
            }
        }
        
        // Create array of unsold items
        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= itemCount; i++) {
            if (!idToMarketItem[i].sold) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex++;
            }
        }
        
        return items;
    }
    
    /**
     * @dev Gets all items created by a seller
     * @param _seller Address of the seller
     * @return Array of items created by the seller
     */
    function fetchItemsCreated(address _seller) external view returns (MarketItem[] memory) {
        uint256 itemCount = _itemIds.current();
        uint256 sellerItemCount = 0;
        
        // Count seller items
        for (uint256 i = 1; i <= itemCount; i++) {
            if (idToMarketItem[i].seller == _seller) {
                sellerItemCount++;
            }
        }
        
        // Create array of seller items
        MarketItem[] memory items = new MarketItem[](sellerItemCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= itemCount; i++) {
            if (idToMarketItem[i].seller == _seller) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex++;
            }
        }
        
        return items;
    }
    
    /**
     * @dev Gets all items owned by a buyer
     * @param _owner Address of the owner
     * @return Array of items owned by the owner
     */
    function fetchMyNFTs(address _owner) external view returns (MarketItem[] memory) {
        uint256 itemCount = _itemIds.current();
        uint256 ownerItemCount = 0;
        
        // Count owner items
        for (uint256 i = 1; i <= itemCount; i++) {
            if (idToMarketItem[i].owner == _owner) {
                ownerItemCount++;
            }
        }
        
        // Create array of owner items
        MarketItem[] memory items = new MarketItem[](ownerItemCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= itemCount; i++) {
            if (idToMarketItem[i].owner == _owner) {
                items[currentIndex] = idToMarketItem[i];
                currentIndex++;
            }
        }
        
        return items;
    }
    
    /**
     * @dev Implementation of IERC721Receiver
     */
    function onERC721Received(
        address,
        address from,
        uint256 tokenId,
        bytes calldata
    ) external override returns (bytes4) {
        // Set direct deposit
        directDeposits[msg.sender][tokenId] = from;
        return this.onERC721Received.selector;
    }
}
