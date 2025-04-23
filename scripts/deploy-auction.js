const hre = require("hardhat");

async function main() {
  // Адрес fee collector из .env
  const feeCollector = process.env.REACT_APP_FEE_COLLECTOR || "0x98a68E9f8DCB48c717c4cA1D7c0435CFd897393f";
  
  console.log("Deploying NFTAuction contract with fee collector:", feeCollector);

  // Деплоим контракт NFTAuction
  const NFTAuction = await hre.ethers.getContractFactory("NFTAuction");
  const nftAuction = await NFTAuction.deploy(feeCollector);

  await nftAuction.deployed();

  console.log("NFTAuction deployed to:", nftAuction.address);
  
  // Сохраняем адрес контракта в .env
  console.log("Add this line to your .env file:");
  console.log(`REACT_APP_AUCTION_ADDRESS=${nftAuction.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
