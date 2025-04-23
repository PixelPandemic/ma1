const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Running script with the account:", deployer.address);

  // Старый адрес маркетплейса
  const oldMarketplaceAddress = "0x075643E563c95A23064D3a75aa3407681ebF1eAD";
  console.log("Old marketplace address:", oldMarketplaceAddress);

  // Новый адрес маркетплейса
  const newMarketplaceAddress = "0x3a89d744178E914D45acA30cc6351a1c8a660D14";
  console.log("New marketplace address:", newMarketplaceAddress);

  // Адрес NFT контракта
  const nftContractAddress = "0xDB2218a06F3e95C3bAFe7c21a07d120585259d2D";
  console.log("NFT contract address:", nftContractAddress);

  // Получаем экземпляр контракта NFT
  const nftContract = await hre.ethers.getContractAt("MetaArtNFT", nftContractAddress);

  // Проверяем, кто владеет NFT с ID 1
  const owner = await nftContract.ownerOf(1);
  console.log("Current owner of NFT #1:", owner);

  if (owner.toLowerCase() !== oldMarketplaceAddress.toLowerCase()) {
    console.log("NFT #1 is not owned by the old marketplace. Cannot transfer.");
    return;
  }

  // Создаем экземпляр контракта старого маркетплейса
  const oldMarketplace = await hre.ethers.getContractAt("NFTMarketplace", oldMarketplaceAddress);

  // Вызываем функцию transferNFT от имени старого маркетплейса
  console.log("Transferring NFT #1 from old marketplace to new marketplace...");
  const tx = await oldMarketplace.transferNFT(nftContractAddress, 1, newMarketplaceAddress);
  await tx.wait();

  console.log("Transaction hash:", tx.hash);

  // Проверяем, что NFT теперь принадлежит новому маркетплейсу
  const newOwner = await nftContract.ownerOf(1);
  console.log("New owner of NFT #1:", newOwner);

  if (newOwner.toLowerCase() === newMarketplaceAddress.toLowerCase()) {
    console.log("NFT #1 successfully transferred to the new marketplace!");
  } else {
    console.log("Transfer failed. NFT #1 is still owned by:", newOwner);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
