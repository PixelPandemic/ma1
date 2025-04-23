// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ARTToken.sol";

contract NFTStaking is ReentrancyGuard, Ownable {
    IERC721 public nftCollection;
    ARTToken public rewardsToken;

    struct Stake {
        uint256 tokenId;
        uint256 timestamp;
        address owner;
    }

    mapping(uint256 => Stake) public vault;
    mapping(address => uint256[]) public stakedNFTs;

    uint256 public totalStaked;
    uint256 public rewardRate = 10 * 10**18; // 10 ART tokens per hour

    event NFTStaked(address owner, uint256 tokenId, uint256 timestamp);
    event NFTUnstaked(address owner, uint256 tokenId, uint256 timestamp);
    event RewardsClaimed(address owner, uint256 reward);

    constructor(IERC721 _nftCollection, ARTToken _rewardsToken) {
        nftCollection = _nftCollection;
        rewardsToken = _rewardsToken;
    }

    function stake(uint256 tokenId) external nonReentrant {
        require(nftCollection.ownerOf(tokenId) == msg.sender, "Not owner");
        nftCollection.transferFrom(msg.sender, address(this), tokenId);

        vault[tokenId] = Stake({
            owner: msg.sender,
            tokenId: tokenId,
            timestamp: block.timestamp
        });

        stakedNFTs[msg.sender].push(tokenId);
        totalStaked++;

        emit NFTStaked(msg.sender, tokenId, block.timestamp);
    }

    function calculateRewards(uint256 tokenId) public view returns (uint256) {
        Stake memory staked = vault[tokenId];
        require(staked.owner != address(0), "Not staked");

        uint256 hoursStaked = (block.timestamp - staked.timestamp) / 3600;
        uint256 baseReward = 10 * 10**18; // 10 ART tokens per hour
        uint256 totalReward = 0;

        for(uint256 i = 0; i < hoursStaked; i++) {
            totalReward += baseReward + (i * 10 * 10**18); // Increasing by 10 tokens each hour
        }

        return totalReward;
    }

    function unstake(uint256 tokenId) external nonReentrant {
        Stake memory staked = vault[tokenId];
        require(staked.owner == msg.sender, "Not owner");

        uint256 reward = calculateRewards(tokenId);

        // Remove from stakedNFTs array
        uint256[] storage userStakedNFTs = stakedNFTs[msg.sender];
        for (uint256 i = 0; i < userStakedNFTs.length; i++) {
            if (userStakedNFTs[i] == tokenId) {
                // Replace with the last element and pop
                userStakedNFTs[i] = userStakedNFTs[userStakedNFTs.length - 1];
                userStakedNFTs.pop();
                break;
            }
        }

        delete vault[tokenId];
        totalStaked--;

        nftCollection.transferFrom(address(this), msg.sender, tokenId);
        rewardsToken.mintRewards(msg.sender, reward);

        emit NFTUnstaked(msg.sender, tokenId, block.timestamp);
        emit RewardsClaimed(msg.sender, reward);
    }

    // Get all staked NFTs for a user
    function getStakedNFTs(address user) external view returns (uint256[] memory) {
        return stakedNFTs[user];
    }

    // Get total rewards for a user across all staked NFTs
    function getTotalRewards(address user) external view returns (uint256) {
        uint256[] memory userNFTs = stakedNFTs[user];
        uint256 totalReward = 0;

        for (uint256 i = 0; i < userNFTs.length; i++) {
            totalReward += calculateRewards(userNFTs[i]);
        }

        return totalReward;
    }

    // Get staking info for a specific NFT
    function getStakingInfo(uint256 tokenId) external view returns (address owner, uint256 timestamp, uint256 rewards) {
        Stake memory staked = vault[tokenId];
        require(staked.owner != address(0), "Not staked");

        return (staked.owner, staked.timestamp, calculateRewards(tokenId));
    }

    // Calculate real-time rewards with seconds precision for UI display
    function calculateRealTimeRewards(uint256 tokenId) external view returns (uint256) {
        Stake memory staked = vault[tokenId];
        require(staked.owner != address(0), "Not staked");

        uint256 timeStaked = block.timestamp - staked.timestamp;
        uint256 hoursStaked = timeStaked / 3600;
        uint256 secondsIntoCurrentHour = timeStaked % 3600;

        // Calculate rewards for completed hours
        uint256 totalReward = 0;
        for(uint256 i = 0; i < hoursStaked; i++) {
            totalReward += rewardRate + (i * 10 * 10**18); // Increasing by 10 tokens each hour
        }

        // Add partial rewards for the current hour in progress
        if (secondsIntoCurrentHour > 0) {
            uint256 currentHourRate = rewardRate + (hoursStaked * 10 * 10**18);
            uint256 partialReward = (currentHourRate * secondsIntoCurrentHour) / 3600;
            totalReward += partialReward;
        }

        return totalReward;
    }
}