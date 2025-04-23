// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SimpleMarketplace
 * @dev A simple marketplace contract for buying and selling NFTs
 */
contract SimpleMarketplace is IERC721Receiver, Ownable, ReentrancyGuard {
    // Fee percentage (5%)
    uint256 public constant FEE_PERCENTAGE = 5;
    
    // Fee collector address
    address public feeCollector;
    
    // Mapping from NFT contract address and token ID to price
    mapping(address => mapping(uint256 => uint256)) public nftPrices;
    
    // Mapping from NFT contract address and token ID to seller
    mapping(address => mapping(uint256 => address)) public nftSellers;
    
    // Events
    event NFTListed(address indexed nftContract, uint256 indexed tokenId, uint256 price, address indexed seller);
    event NFTSold(address indexed nftContract, uint256 indexed tokenId, address seller, address buyer, uint256 price);
    event NFTWithdrawn(address indexed nftContract, uint256 indexed tokenId, address indexed owner);
    
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
     * @dev Lists an NFT for sale
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID of the NFT
     * @param _price Price of the NFT in wei
     */
    function listNFT(address _nftContract, uint256 _tokenId, uint256 _price) external nonReentrant {
        require(_price > 0, "Price must be greater than zero");
        
        // Transfer NFT to marketplace
        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);
        
        // Set price and seller
        nftPrices[_nftContract][_tokenId] = _price;
        nftSellers[_nftContract][_tokenId] = msg.sender;
        
        emit NFTListed(_nftContract, _tokenId, _price, msg.sender);
    }
    
    /**
     * @dev Buys an NFT
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID of the NFT
     */
    function buyNFT(address _nftContract, uint256 _tokenId) external payable nonReentrant {
        uint256 price = nftPrices[_nftContract][_tokenId];
        address seller = nftSellers[_nftContract][_tokenId];
        
        require(price > 0, "NFT not for sale");
        require(msg.value == price, "Incorrect price");
        require(seller != address(0), "Seller not found");
        require(seller != msg.sender, "Seller cannot buy their own NFT");
        
        // Calculate fee
        uint256 fee = (price * FEE_PERCENTAGE) / 100;
        uint256 sellerProceeds = price - fee;
        
        // Clear price and seller
        nftPrices[_nftContract][_tokenId] = 0;
        nftSellers[_nftContract][_tokenId] = address(0);
        
        // Transfer NFT to buyer
        IERC721(_nftContract).transferFrom(address(this), msg.sender, _tokenId);
        
        // Transfer funds to seller and fee collector
        payable(seller).transfer(sellerProceeds);
        payable(feeCollector).transfer(fee);
        
        emit NFTSold(_nftContract, _tokenId, seller, msg.sender, price);
    }
    
    /**
     * @dev Withdraws an NFT from the marketplace
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID of the NFT
     */
    function withdrawNFT(address _nftContract, uint256 _tokenId) external nonReentrant {
        address seller = nftSellers[_nftContract][_tokenId];
        require(seller == msg.sender, "Only seller can withdraw NFT");
        
        // Clear price and seller
        nftPrices[_nftContract][_tokenId] = 0;
        nftSellers[_nftContract][_tokenId] = address(0);
        
        // Transfer NFT back to seller
        IERC721(_nftContract).transferFrom(address(this), msg.sender, _tokenId);
        
        emit NFTWithdrawn(_nftContract, _tokenId, msg.sender);
    }
    
    /**
     * @dev Gets the price of an NFT
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID of the NFT
     * @return Price of the NFT in wei
     */
    function getNFTPrice(address _nftContract, uint256 _tokenId) external view returns (uint256) {
        return nftPrices[_nftContract][_tokenId];
    }
    
    /**
     * @dev Gets the seller of an NFT
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID of the NFT
     * @return Address of the seller
     */
    function getNFTSeller(address _nftContract, uint256 _tokenId) external view returns (address) {
        return nftSellers[_nftContract][_tokenId];
    }
    
    /**
     * @dev Implementation of IERC721Receiver
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
