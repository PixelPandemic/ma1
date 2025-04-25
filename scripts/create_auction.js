const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Running script with the account:", deployer.address);

  // Адрес контракта NFT
  const nftContractAddress = process.env.REACT_APP_NFT_CONTRACT_ADDRESS;
  console.log("NFT Contract address:", nftContractAddress);

  // Адрес контракта аукциона
  const auctionContractAddress = process.env.REACT_APP_AUCTION_ADDRESS;
  console.log("Auction Contract address:", auctionContractAddress);

  // ID токена NFT
  const tokenId = 1; // Замените на ID вашего NFT
  console.log("Token ID:", tokenId);

  // Получаем экземпляр контракта NFT
  const nftContract = await hre.ethers.getContractAt("MetaArtNFT", nftContractAddress);

  // Проверяем, кто владеет NFT
  const owner = await nftContract.ownerOf(tokenId);
  console.log("Current owner of NFT:", owner);

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("You are not the owner of this NFT. Cannot create auction.");
    return;
  }

  // Проверяем, одобрен ли контракт аукциона для передачи NFT
  const isApprovedForAll = await nftContract.isApprovedForAll(deployer.address, auctionContractAddress);
  console.log("Is approved for all:", isApprovedForAll);

  const approvedAddress = await nftContract.getApproved(tokenId);
  console.log("Approved address for token:", approvedAddress);

  // Если NFT не одобрен, одобряем его
  if (!isApprovedForAll && approvedAddress.toLowerCase() !== auctionContractAddress.toLowerCase()) {
    console.log("Approving NFT for auction contract...");

    // Сначала пробуем одобрить конкретный токен
    try {
      const approveTx = await nftContract.approve(auctionContractAddress, tokenId, { gasLimit: 500000 });
      await approveTx.wait();
      console.log("NFT approved successfully!");
    } catch (approveError) {
      console.error("Error approving specific token:", approveError);

      // Если не удалось одобрить конкретный токен, пробуем одобрить все токены
      console.log("Trying to approve all tokens...");
      const approveAllTx = await nftContract.setApprovalForAll(auctionContractAddress, true, { gasLimit: 500000 });
      await approveAllTx.wait();
      console.log("All NFTs approved successfully!");
    }
  }

  // Получаем экземпляр контракта аукциона
  const auctionContract = await hre.ethers.getContractAt("NFTAuction", auctionContractAddress);

  // Параметры аукциона
  const startingPrice = hre.ethers.utils.parseEther("0.1"); // 0.1 MATIC
  const duration = 3600; // 1 час в секундах

  console.log("Creating auction with parameters:");
  console.log("- NFT Contract:", nftContractAddress);
  console.log("- Token ID:", tokenId);
  console.log("- Starting Price:", hre.ethers.utils.formatEther(startingPrice), "MATIC");
  console.log("- Duration:", duration, "seconds");

  // Создаем аукцион
  const tx = await auctionContract.createAuction(
    nftContractAddress,
    tokenId,
    startingPrice,
    duration,
    { gasLimit: 500000 }
  );

  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("Auction created successfully!");

  // Получаем ID созданного аукциона
  const auctionId = await auctionContract.nftToAuction(nftContractAddress, tokenId);
  console.log("Auction ID:", auctionId.toString());

  // Получаем данные аукциона
  const auction = await auctionContract.auctions(auctionId);
  console.log("Auction data:", {
    id: auction.id.toString(),
    seller: auction.seller,
    nftContract: auction.nftContract,
    tokenId: auction.tokenId.toString(),
    startingPrice: hre.ethers.utils.formatEther(auction.startingPrice),
    endTime: new Date(auction.endTime.toNumber() * 1000).toLocaleString(),
    highestBidder: auction.highestBidder,
    highestBid: hre.ethers.utils.formatEther(auction.highestBid),
    ended: auction.ended
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
