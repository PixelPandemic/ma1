const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Running script with the account:", deployer.address);

  // Получаем адрес маркетплейса из .env
  const marketplaceAddress = process.env.REACT_APP_MARKETPLACE_ADDRESS;
  console.log("Marketplace address:", marketplaceAddress);

  // Получаем адрес NFT контракта из .env
  const nftContractAddress = process.env.REACT_APP_NFT_CONTRACT_ADDRESS;
  console.log("NFT contract address:", nftContractAddress);

  // Получаем экземпляр контракта маркетплейса
  const marketplace = await hre.ethers.getContractAt("NFTMarketplace", marketplaceAddress);

  // Параметры для вызова функции adminListNFT
  const tokenId = 1; // ID токена
  const price = hre.ethers.utils.parseEther("0.1"); // Цена в ETH
  const seller = deployer.address; // Адрес продавца (владелец контракта)

  console.log(`Listing NFT #${tokenId} for sale at ${hre.ethers.utils.formatEther(price)} ETH`);

  // Вызываем функцию adminListNFT
  const tx = await marketplace.adminListNFT(nftContractAddress, tokenId, price, seller);
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
