const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Running script with the account:", deployer.address);

  // Адрес маркетплейса
  const marketplaceAddress = process.env.REACT_APP_MARKETPLACE_ADDRESS;
  console.log("Marketplace address:", marketplaceAddress);

  // Адрес NFT контракта
  const nftContractAddress = process.env.REACT_APP_NFT_CONTRACT_ADDRESS;
  console.log("NFT contract address:", nftContractAddress);

  // Получаем экземпляр контракта NFT
  const nftContract = await hre.ethers.getContractAt("MetaArtNFT", nftContractAddress);

  // Проверяем, кто владеет NFT с ID 1
  const owner = await nftContract.ownerOf(1);
  console.log("Current owner of NFT #1:", owner);

  if (owner.toLowerCase() !== marketplaceAddress.toLowerCase()) {
    console.log("NFT #1 is not owned by the marketplace. Cannot list for sale.");
    return;
  }

  // Получаем экземпляр контракта маркетплейса
  const marketplace = await hre.ethers.getContractAt("NFTMarketplace", marketplaceAddress);

  // Параметры для вызова функции adminListNFT
  const tokenId = 1; // ID токена
  const price = hre.ethers.utils.parseEther("0.1"); // Цена в MATIC
  const seller = deployer.address; // Адрес продавца (владелец контракта)

  console.log(`Listing NFT #${tokenId} for sale at ${hre.ethers.utils.formatEther(price)} MATIC`);

  // Вызываем функцию adminListNFT
  const tx = await marketplace.adminListNFT(nftContractAddress, tokenId, price, seller, { gasLimit: 500000 });
  await tx.wait();

  console.log("Transaction hash:", tx.hash);
  console.log("NFT successfully listed for sale!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
