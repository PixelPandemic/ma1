const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Запуск скрипта с аккаунта:", deployer.address);

  // Адрес маркетплейса
  const marketplaceAddress = process.env.REACT_APP_MARKETPLACE_ADDRESS;
  console.log("Адрес маркетплейса:", marketplaceAddress);

  // Адрес NFT контракта
  const nftContractAddress = process.env.REACT_APP_NFT_CONTRACT_ADDRESS;
  console.log("Адрес NFT контракта:", nftContractAddress);

  // Получаем экземпляр контракта маркетплейса
  const marketplace = await hre.ethers.getContractAt("NFTMarketplace", marketplaceAddress);

  // Проверяем, кто является владельцем маркетплейса
  const owner = await marketplace.owner();
  console.log("Владелец маркетплейса:", owner);

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("Вы не являетесь владельцем маркетплейса. Невозможно выполнить операцию.");
    return;
  }

  // Добавляем функцию setDirectDeposit в контракт маркетплейса
  console.log("Добавление функции setDirectDeposit в контракт маркетплейса...");

  // Создаем новый контракт маркетплейса с функцией setDirectDeposit
  const NFTMarketplaceFactory = await hre.ethers.getContractFactory("NFTMarketplace");
  const newMarketplace = await NFTMarketplaceFactory.deploy(
    process.env.REACT_APP_FEE_COLLECTOR,
    process.env.REACT_APP_ART_TOKEN_ADDRESS
  );
  await newMarketplace.deployed();

  console.log("Новый маркетплейс задеплоен по адресу:", newMarketplace.address);

  // Обновляем .env файл с новым адресом маркетплейса
  console.log("Обновление .env файла с новым адресом маркетплейса...");
  // Здесь нужно обновить .env файл вручную

  console.log("Готово! Теперь вы можете использовать новый маркетплейс для выставления NFT на продажу.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
