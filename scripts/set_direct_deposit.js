const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Запуск скрипта с аккаунта:", deployer.address);

  // Адрес нового маркетплейса
  const newMarketplaceAddress = "0x17B8a42C12876B69504628a0B82709662146DB36";
  console.log("Адрес нового маркетплейса:", newMarketplaceAddress);

  // Адрес старого маркетплейса
  const oldMarketplaceAddress = "0x075643E563c95A23064D3a75aa3407681ebF1eAD";
  console.log("Адрес старого маркетплейса:", oldMarketplaceAddress);

  // Адрес NFT контракта
  const nftContractAddress = "0xDB2218a06F3e95C3bAFe7c21a07d120585259d2D";
  console.log("Адрес NFT контракта:", nftContractAddress);

  // Получаем экземпляр контракта NFT
  const nftContract = await hre.ethers.getContractAt("MetaArtNFT", nftContractAddress);

  // Проверяем, кто владеет NFT с ID 1
  const owner = await nftContract.ownerOf(1);
  console.log("Текущий владелец NFT #1:", owner);

  if (owner.toLowerCase() !== oldMarketplaceAddress.toLowerCase()) {
    console.log("NFT #1 не принадлежит старому маркетплейсу. Невозможно выполнить операцию.");
    return;
  }

  // Получаем экземпляр контракта нового маркетплейса
  const newMarketplace = await hre.ethers.getContractAt("NFTMarketplace", newMarketplaceAddress);

  // Создаем скрипт для передачи NFT со старого маркетплейса на новый
  console.log("Создание скрипта для передачи NFT со старого маркетплейса на новый...");

  // Здесь нужно вручную выполнить следующие шаги:
  // 1. Обновить .env файл, чтобы REACT_APP_MARKETPLACE_ADDRESS указывал на новый адрес маркетплейса
  // 2. Перезапустить приложение
  // 3. Перейти на вкладку "Marketplace NFTs"
  // 4. Нажать кнопку "List for Sale" для NFT с ID 1
  // 5. Ввести цену и нажать кнопку "List for Sale"
  // 6. Подтвердить транзакцию в MetaMask

  console.log("Готово! Теперь вы можете выполнить следующие шаги:");
  console.log("1. Обновите .env файл, чтобы REACT_APP_MARKETPLACE_ADDRESS указывал на новый адрес маркетплейса:", newMarketplaceAddress);
  console.log("2. Перезапустите приложение");
  console.log("3. Перейдите на вкладку 'Marketplace NFTs'");
  console.log("4. Нажмите кнопку 'List for Sale' для NFT с ID 1");
  console.log("5. Введите цену и нажмите кнопку 'List for Sale'");
  console.log("6. Подтвердите транзакцию в MetaMask");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
