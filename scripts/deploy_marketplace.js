const hre = require("hardhat");

async function main() {
  // Получаем аккаунт для деплоя
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Получаем баланс аккаунта
  const balance = await deployer.getBalance();
  console.log("Account balance:", hre.ethers.utils.formatEther(balance));

  // Адрес для сбора комиссий (адрес владельца проекта)
  const feeCollectorAddress = "0x98a68E9f8DCB48c717c4cA1D7c0435CFd897393f";
  console.log("Fee Collector Address:", feeCollectorAddress);

  // Деплоим новый контракт маркетплейса
  const MetaArtMarketplace = await hre.ethers.getContractFactory("MetaArtMarketplace");
  const marketplace = await MetaArtMarketplace.deploy(feeCollectorAddress);
  await marketplace.deployed();

  console.log("MetaArtMarketplace deployed to:", marketplace.address);
  console.log("Update your .env file with the following line:");
  console.log(`REACT_APP_MARKETPLACE_ADDRESS=${marketplace.address}`);
}

// Запускаем функцию деплоя
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
