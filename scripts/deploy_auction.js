const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Получаем адрес fee collector из .env
  const feeCollector = process.env.REACT_APP_FEE_COLLECTOR;
  console.log("Fee collector address:", feeCollector);

  // Деплоим контракт аукциона
  const NFTAuction = await hre.ethers.getContractFactory("NFTAuction");
  const nftAuction = await NFTAuction.deploy(feeCollector);
  await nftAuction.deployed();

  console.log("NFTAuction deployed to:", nftAuction.address);

  // Обновляем .env файл с новым адресом контракта аукциона
  console.log("Update your .env file with the following line:");
  console.log(`REACT_APP_AUCTION_ADDRESS=${nftAuction.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
