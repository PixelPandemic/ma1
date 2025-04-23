const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Running script with the account:", deployer.address);

  // Старый адрес маркетплейса
  const oldMarketplaceAddress = "0x075643E563c95A23064D3a75aa3407681ebF1eAD";
  console.log("Old marketplace address:", oldMarketplaceAddress);

  // Новый адрес маркетплейса
  const newMarketplaceAddress = process.env.REACT_APP_MARKETPLACE_ADDRESS;
  console.log("New marketplace address:", newMarketplaceAddress);

  // Адрес NFT контракта
  const nftContractAddress = process.env.REACT_APP_NFT_CONTRACT_ADDRESS;
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

  // Создаем новый экземпляр контракта старого маркетплейса
  // Нам нужно использовать интерфейс, который включает функцию safeTransferFrom
  const oldMarketplace = await hre.ethers.getContractAt("NFTMarketplace", oldMarketplaceAddress);

  // Вызываем функцию safeTransferFrom от имени старого маркетплейса
  // Для этого нам нужно иметь права владельца на старом маркетплейсе
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
