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

  // Получаем экземпляр контракта старого маркетплейса
  const oldMarketplace = await hre.ethers.getContractAt("NFTMarketplace", oldMarketplaceAddress);

  // Проверяем, кто является владельцем старого маркетплейса
  const oldMarketplaceOwner = await oldMarketplace.owner();
  console.log("Владелец старого маркетплейса:", oldMarketplaceOwner);

  if (oldMarketplaceOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("Вы не являетесь владельцем старого маркетплейса. Невозможно выполнить операцию.");
    return;
  }

  // Создаем новый интерфейс для старого маркетплейса с функцией transferNFT
  const oldMarketplaceWithTransfer = new ethers.Contract(
    oldMarketplaceAddress,
    [
      "function transferNFT(address _nftContract, uint256 _tokenId, address _to) external",
      "function owner() external view returns (address)"
    ],
    deployer
  );

  // Вызываем функцию transferNFT старого маркетплейса
  console.log("Передача NFT #1 со старого маркетплейса на новый...");
  try {
    const tx = await oldMarketplaceWithTransfer.transferNFT(
      nftContractAddress,
      1,
      newMarketplaceAddress,
      { gasLimit: 500000 }
    );
    await tx.wait();
    console.log("Транзакция успешно выполнена! Хеш транзакции:", tx.hash);
  } catch (error) {
    console.error("Ошибка при передаче NFT:", error);
    return;
  }

  // Проверяем, что NFT теперь принадлежит новому маркетплейсу
  const newOwner = await nftContract.ownerOf(1);
  console.log("Новый владелец NFT #1:", newOwner);

  if (newOwner.toLowerCase() === newMarketplaceAddress.toLowerCase()) {
    console.log("NFT #1 успешно передан на новый маркетплейс!");
  } else {
    console.log("Передача не удалась. NFT #1 все еще принадлежит:", newOwner);
    return;
  }

  // Получаем экземпляр контракта нового маркетплейса
  const newMarketplace = await hre.ethers.getContractAt("NFTMarketplace", newMarketplaceAddress);

  // Устанавливаем владельца депозита для NFT с ID 1
  console.log("Установка владельца депозита для NFT #1...");
  try {
    const tx = await newMarketplace.setDirectDeposit(
      nftContractAddress,
      1,
      deployer.address,
      { gasLimit: 500000 }
    );
    await tx.wait();
    console.log("Транзакция успешно выполнена! Хеш транзакции:", tx.hash);
  } catch (error) {
    console.error("Ошибка при установке владельца депозита:", error);
    return;
  }

  // Проверяем, что владелец депозита установлен
  const depositor = await newMarketplace.getDirectDeposit(nftContractAddress, 1);
  console.log("Владелец депозита для NFT #1:", depositor);

  if (depositor.toLowerCase() === deployer.address.toLowerCase()) {
    console.log("Владелец депозита успешно установлен!");
  } else {
    console.log("Установка владельца депозита не удалась. Текущий владелец депозита:", depositor);
    return;
  }

  console.log("Готово! Теперь вы можете выставить NFT на продажу через интерфейс приложения.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
