const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Running script with the account:", deployer.address);

  // Адрес токена ART
  const artTokenAddress = "0xF20F40891b3983416294C013304b4C8E012b9B02";
  console.log("ART Token address:", artTokenAddress);

  // Адрес контракта стейкинга
  const stakingContractAddress = "0xaB4dCef0797a0E2d4F7a3BEC53B78B8aeAbf5881";
  console.log("Staking Contract address:", stakingContractAddress);

  // Получаем экземпляр контракта ART Token
  const artToken = await hre.ethers.getContractAt("ARTToken", artTokenAddress);

  // Проверяем текущий адрес контракта стейкинга
  const currentStakingContract = await artToken.stakingContract();
  console.log("Current Staking Contract in ART Token:", currentStakingContract);

  if (currentStakingContract.toLowerCase() === stakingContractAddress.toLowerCase()) {
    console.log("Staking Contract is already set correctly.");
    return;
  }

  // Устанавливаем адрес контракта стейкинга
  console.log("Setting Staking Contract in ART Token...");
  const tx = await artToken.setStakingContract(stakingContractAddress, { gasLimit: 500000 });
  await tx.wait();

  // Проверяем, что адрес контракта стейкинга установлен правильно
  const newStakingContract = await artToken.stakingContract();
  console.log("New Staking Contract in ART Token:", newStakingContract);

  if (newStakingContract.toLowerCase() === stakingContractAddress.toLowerCase()) {
    console.log("Staking Contract set successfully!");
  } else {
    console.log("Failed to set Staking Contract.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
