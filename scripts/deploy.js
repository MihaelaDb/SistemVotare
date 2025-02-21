const hre = require("hardhat"); // importam hardhat pentru a rula scriptul de deploy

async function main() {
    const [deployer] = await hre.ethers.getSigners(); // obtinem adresa contului care va deploya contractele
    console.log("Deploying contracts with the account:", deployer.address);
  
    // deployeaza contractul Admin
    const Admin = await ethers.getContractFactory("Admin");
    console.log("Deploying contract...");
    const admin = await Admin.deploy(deployer.address, "Initial Candidate", deployer.address); // initializeaza contractul cu un candidat initial
    console.log("Admin contract deployed to:", admin.target);
  
    // deployeaza contractul Payment
    const Payment = await hre.ethers.getContractFactory("Payment");
    console.log("Deploying contract...");
    const payment = await Payment.deploy(deployer.address, 1.000000, 5, 10); // seteaza taxa de vot si limitele de voturi gratuite/platite
    console.log("Payment contract deployed to:", payment.target);
  
    // deployeaza contractul Voting
    const Voting = await hre.ethers.getContractFactory("Voting");
    console.log("Deploying contract...");
    const voting = await Voting.deploy(deployer.address, admin.target, payment.target); // conecteaza contractele Admin si Payment
    console.log("Voting contract deployed to:", voting.target);
    
    // salveaza adresele contractelor si ABIs in fisiere pentru frontend
    saveFrontendFiles(admin, 'Admin');
    saveFrontendFiles(payment, 'Payment');
    saveFrontendFiles(voting, 'Voting');
}

// functie care salveaza adresele contractelor si artifactele pentru frontend
function saveFrontendFiles(contract, name) {
    const fs = require("fs"); // importam file system pentru a manipula fisiere
    const contractsDir = __dirname + "/../frontend/src/contracts"; // directorul unde se salveaza contractele pentru frontend
  
    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir, { recursive: true }); // daca directorul nu exista, il cream
    }
  
    // salveaza adresa contractului intr-un fisier JSON
    fs.writeFileSync(
      contractsDir + `/${name}-address.json`,
      JSON.stringify({ address: contract.address }, undefined, 2)
    );
  
    // citeste ABI-ul contractului si il salveaza intr-un fisier JSON
    const ContractArtifact = hre.artifacts.readArtifactSync(name);
  
    fs.writeFileSync(
      contractsDir + `/${name}.json`,
      JSON.stringify(ContractArtifact, null, 2)
    );
}

// executa scriptul de deploy si gestioneaza eventualele erori
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
