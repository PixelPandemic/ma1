const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Running script with the account:", deployer.address);

  // Адрес контракта NFT
  const nftContractAddress = "0xDB2218a06F3e95C3bAFe7c21a07d120585259d2D";
  console.log("NFT Contract address:", nftContractAddress);

  // Адрес контракта стейкинга
  const stakingContractAddress = "0xaB4dCef0797a0E2d4F7a3BEC53B78B8aeAbf5881";
  console.log("Staking Contract address:", stakingContractAddress);

  // Получаем экземпляр контракта NFT
  const nftContract = await hre.ethers.getContractAt("MetaArtNFT", nftContractAddress);

  // Проверяем, одобрен ли контракт стейкинга для передачи NFT
  const isApprovedForAll = await nftContract.isApprovedForAll(stakingContractAddress, nftContractAddress);
  console.log("Is Staking Contract approved for all NFTs:", isApprovedForAll);

  // Если контракт стейкинга не одобрен, одобряем его
  if (!isApprovedForAll) {
    console.log("Approving Staking Contract for all NFTs...");

    // Создаем экземпляр контракта стейкинга
    const stakingContract = await hre.ethers.getContractAt("NFTStaking", stakingContractAddress);

    // Получаем адрес владельца контракта стейкинга
    const stakingContractOwner = await stakingContract.owner();
    console.log("Staking Contract owner:", stakingContractOwner);

    if (stakingContractOwner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("You are not the owner of the Staking Contract. Cannot approve.");
      return;
    }

    // Одобряем контракт стейкинга для передачи всех NFT
    const tx = await nftContract.setApprovalForAll(nftContractAddress, true, { gasLimit: 500000 });
    await tx.wait();

    // Проверяем, что контракт стейкинга одобрен
    const newIsApprovedForAll = await nftContract.isApprovedForAll(stakingContractAddress, nftContractAddress);
    console.log("Is Staking Contract approved for all NFTs after approval:", newIsApprovedForAll);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
