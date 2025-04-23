// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title NFTAuction
 * @dev Contract for auctioning NFTs
 */
contract NFTAuction is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _auctionIds;

    // Fee percentage (5%)
    uint256 public constant FEE_PERCENTAGE = 5;
    
    // Fee collector address
    address public feeCollector;

    struct Auction {
        uint256 id;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startingPrice;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool ended;
    }

    // Mapping from auction ID to Auction
    mapping(uint256 => Auction) public auctions;
    
    // Mapping from NFT contract address and token ID to auction ID
    mapping(address => mapping(uint256 => uint256)) public nftToAuction;
    
    // Events
    event AuctionCreated(uint256 indexed auctionId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 startingPrice, uint256 endTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 amount);
    event AuctionCancelled(uint256 indexed auctionId);

    constructor(address _feeCollector) {
        feeCollector = _feeCollector;
    }

    /**
     * @dev Creates a new auction
     * @param _nftContract Address of the NFT contract
     * @param _tokenId Token ID of the NFT
     * @param _startingPrice Starting price of the auction
     * @param _duration Duration of the auction in seconds
     */
    function createAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _startingPrice,
        uint256 _duration
    ) external nonReentrant {
        require(_startingPrice > 0, "Starting price must be greater than zero");
        require(_duration > 0, "Duration must be greater than zero");
        
        // Transfer NFT from seller to this contract
        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);
        
        // Create new auction
        _auctionIds.increment();
        uint256 newAuctionId = _auctionIds.current();
        
        auctions[newAuctionId] = Auction({
            id: newAuctionId,
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            startingPrice: _startingPrice,
            endTime: block.timestamp + _duration,
            highestBidder: address(0),
            highestBid: 0,
            ended: false
        });
        
        // Map NFT to auction
        nftToAuction[_nftContract][_tokenId] = newAuctionId;
        
        emit AuctionCreated(newAuctionId, msg.sender, _nftContract, _tokenId, _startingPrice, block.timestamp + _duration);
    }

    /**
     * @dev Places a bid on an auction
     * @param _auctionId ID of the auction
     */
    function placeBid(uint256 _auctionId) external payable nonReentrant {
        Auction storage auction = auctions[_auctionId];
        
        require(!auction.ended, "Auction already ended");
        require(block.timestamp < auction.endTime, "Auction already ended");
        require(msg.sender != auction.seller, "Seller cannot bid on their own auction");
        
        uint256 bidAmount = msg.value;
        
        if (auction.highestBidder == address(0)) {
            // First bid must be at least the starting price
            require(bidAmount >= auction.startingPrice, "Bid amount must be at least the starting price");
        } else {
            // Subsequent bids must be higher than the current highest bid
            require(bidAmount > auction.highestBid, "Bid amount must be higher than current highest bid");
            
            // Return the previous highest bid to the previous highest bidder
            payable(auction.highestBidder).transfer(auction.highestBid);
        }
        
        // Update auction with new highest bid
        auction.highestBidder = msg.sender;
        auction.highestBid = bidAmount;
        
        emit BidPlaced(_auctionId, msg.sender, bidAmount);
    }

    /**
     * @dev Ends an auction
     * @param _auctionId ID of the auction
     */
    function endAuction(uint256 _auctionId) external nonReentrant {
        Auction storage auction = auctions[_auctionId];
        
        require(!auction.ended, "Auction already ended");
        require(
            msg.sender == auction.seller || 
            msg.sender == owner() || 
            block.timestamp >= auction.endTime, 
            "Only seller or owner can end auction before end time"
        );
        
        auction.ended = true;
        
        if (auction.highestBidder != address(0)) {
            // Calculate fee
            uint256 fee = (auction.highestBid * FEE_PERCENTAGE) / 100;
            uint256 sellerProceeds = auction.highestBid - fee;
            
            // Transfer NFT to highest bidder
            IERC721(auction.nftContract).transferFrom(address(this), auction.highestBidder, auction.tokenId);
            
            // Transfer funds to seller and fee collector
            payable(auction.seller).transfer(sellerProceeds);
            payable(feeCollector).transfer(fee);
            
            emit AuctionEnded(_auctionId, auction.highestBidder, auction.highestBid);
        } else {
            // No bids, return NFT to seller
            IERC721(auction.nftContract).transferFrom(address(this), auction.seller, auction.tokenId);
            
            emit AuctionCancelled(_auctionId);
        }
        
        // Remove NFT to auction mapping
        nftToAuction[auction.nftContract][auction.tokenId] = 0;
    }

    /**
     * @dev Cancels an auction
     * @param _auctionId ID of the auction
     */
    function cancelAuction(uint256 _auctionId) external nonReentrant {
        Auction storage auction = auctions[_auctionId];
        
        require(!auction.ended, "Auction already ended");
        require(msg.sender == auction.seller || msg.sender == owner(), "Only seller or owner can cancel auction");
        require(auction.highestBidder == address(0), "Cannot cancel auction with bids");
        
        auction.ended = true;
        
        // Return NFT to seller
        IERC721(auction.nftContract).transferFrom(address(this), auction.seller, auction.tokenId);
        
        // Remove NFT to auction mapping
        nftToAuction[auction.nftContract][auction.tokenId] = 0;
        
        emit AuctionCancelled(_auctionId);
    }

    /**
     * @dev Gets all active auctions
     * @return Array of active auction IDs
     */
    function getActiveAuctions() external view returns (uint256[] memory) {
        uint256 totalAuctions = _auctionIds.current();
        uint256 activeCount = 0;
        
        // Count active auctions
        for (uint256 i = 1; i <= totalAuctions; i++) {
            if (!auctions[i].ended && block.timestamp < auctions[i].endTime) {
                activeCount++;
            }
        }
        
        // Create array of active auction IDs
        uint256[] memory activeAuctions = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalAuctions; i++) {
            if (!auctions[i].ended && block.timestamp < auctions[i].endTime) {
                activeAuctions[index] = i;
                index++;
            }
        }
        
        return activeAuctions;
    }

    /**
     * @dev Gets auctions created by a specific seller
     * @param _seller Address of the seller
     * @return Array of auction IDs created by the seller
     */
    function getSellerAuctions(address _seller) external view returns (uint256[] memory) {
        uint256 totalAuctions = _auctionIds.current();
        uint256 sellerCount = 0;
        
        // Count seller auctions
        for (uint256 i = 1; i <= totalAuctions; i++) {
            if (auctions[i].seller == _seller) {
                sellerCount++;
            }
        }
        
        // Create array of seller auction IDs
        uint256[] memory sellerAuctions = new uint256[](sellerCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalAuctions; i++) {
            if (auctions[i].seller == _seller) {
                sellerAuctions[index] = i;
                index++;
            }
        }
        
        return sellerAuctions;
    }

    /**
     * @dev Gets auctions where a specific user is the highest bidder
     * @param _bidder Address of the bidder
     * @return Array of auction IDs where the bidder is the highest bidder
     */
    function getBidderAuctions(address _bidder) external view returns (uint256[] memory) {
        uint256 totalAuctions = _auctionIds.current();
        uint256 bidderCount = 0;
        
        // Count bidder auctions
        for (uint256 i = 1; i <= totalAuctions; i++) {
            if (auctions[i].highestBidder == _bidder && !auctions[i].ended) {
                bidderCount++;
            }
        }
        
        // Create array of bidder auction IDs
        uint256[] memory bidderAuctions = new uint256[](bidderCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= totalAuctions; i++) {
            if (auctions[i].highestBidder == _bidder && !auctions[i].ended) {
                bidderAuctions[index] = i;
                index++;
            }
        }
        
        return bidderAuctions;
    }

    /**
     * @dev Gets the total number of auctions
     * @return Total number of auctions
     */
    function getAuctionsCount() external view returns (uint256) {
        return _auctionIds.current();
    }

    /**
     * @dev Updates the fee collector address
     * @param _newFeeCollector New fee collector address
     */
    function setFeeCollector(address _newFeeCollector) external onlyOwner {
        require(_newFeeCollector != address(0), "Fee collector cannot be zero address");
        feeCollector = _newFeeCollector;
    }
}
