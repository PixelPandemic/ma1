const { ethers } = require("hardhat");

async function main() {
  // Deploy ART Token
  const ARTToken = await ethers.getContractFactory("ARTToken");
  const artToken = await ARTToken.deploy();
  await artToken.deployed();
  console.log("ARTToken deployed to:", artToken.address);

  // Deploy MetaArt NFT
  const MetaArtNFT = await ethers.getContractFactory("MetaArtNFT");
  const metaArtNFT = await MetaArtNFT.deploy();
  await metaArtNFT.deployed();
  console.log("MetaArtNFT deployed to:", metaArtNFT.address);

  // Deploy NFT Staking
  const NFTStaking = await ethers.getContractFactory("NFTStaking");
  const nftStaking = await NFTStaking.deploy(metaArtNFT.address, artToken.address);
  await nftStaking.deployed();
  console.log("NFTStaking deployed to:", nftStaking.address);

  // Set up contract relationships
  console.log("Setting up contract relationships...");

  // Set staking contract in ART Token
  let tx = await artToken.setStakingContract(nftStaking.address);
  await tx.wait();
  console.log("Set staking contract in ART Token");

  // Set staking contract in MetaArt NFT
  tx = await metaArtNFT.setStakingContract(nftStaking.address);
  await tx.wait();
  console.log("Set staking contract in MetaArt NFT");

  // Set base URI for NFTs
  const baseURI = "https://meta-art.infura-ipfs.io/ipfs/";
  tx = await metaArtNFT.setBaseURI(baseURI);
  await tx.wait();
  console.log("Set base URI for NFTs");

  // Update .env with contract addresses
  console.log("\nUpdate your .env file with these values:");
  console.log(`REACT_APP_STAKING_CONTRACT_ADDRESS=${nftStaking.address}`);
  console.log(`REACT_APP_NFT_CONTRACT_ADDRESS=${metaArtNFT.address}`);
  console.log(`REACT_APP_ART_TOKEN_ADDRESS=${artToken.address}`);
  console.log(`REACT_APP_BASE_URI=${baseURI}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });