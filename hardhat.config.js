const { defaultNetwork } = require("../proiectblockchain/hardhat.config"); // importam configuratia implicita a retelei

require("@nomicfoundation/hardhat-toolbox"); // importam Hardhat Toolbox pentru testare si dezvoltare

module.exports = {
  solidity: "0.8.24", // specificam versiunea Solidity utilizata pentru compilare
  defaultNetwork: "running", // setam reteaua implicita pentru deploy
  networks: {
    hardhat: {
      chainId: 1337, // definim chain id ul pentru reteaua locala Hardhat
    },
  },
  running: {
    url: "http://localhost:8545", // URL-ul retelei locale pentru testare
    chainId: 1337, // chain ID-ul pentru retea
    gas: 2100000, // limita de gas alocata pentru tranzactii
    gasPrice: 8000000000, // pretul gazului pentru tranzactii
  },
};
