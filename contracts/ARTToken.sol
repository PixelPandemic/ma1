// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ARTToken is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 100_000_000_000_000 * 10**18; // 100 trillion tokens
    address public stakingContract;

    constructor() ERC20("ART Token", "ART") {
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = _stakingContract;
    }

    function mintRewards(address to, uint256 amount) external {
        require(msg.sender == stakingContract, "Only staking contract can mint rewards");
        _mint(to, amount);
    }
}