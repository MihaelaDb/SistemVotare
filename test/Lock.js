const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers"); // importam utilitare pentru testare si manipularea timpului in blockchain
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs"); // importam chai matchers pentru verificarea eventurilor
const { expect } = require("chai"); // importam libraria Chai pentru asertii in teste

describe("Lock", function () {
  // definim o fixture pentru a reutiliza aceeasi configuratie in fiecare test
  // loadFixture ne permite sa pastram un snapshot al blockchain-ului pentru fiecare test
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60; // numarul de secunde intr-un an
    const ONE_GWEI = 1_000_000_000; // definim o valoare in Gwei

    const lockedAmount = ONE_GWEI; // suma blocata in contract
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS; // setam timpul de deblocare in viitor

    // obtinem doua conturi de testare din Hardhat
    const [owner, otherAccount] = await ethers.getSigners();

    // obtinem contractul Lock
    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount }); // deployam contractul cu fondurile initiale

    return { lock, unlockTime, lockedAmount, owner, otherAccount }; // returnam variabilele pentru reutilizare in teste
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.unlockTime()).to.equal(unlockTime); // verificam daca timpul de deblocare este corect setat
    });

    it("Should set the right owner", async function () {
      const { lock, owner } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.owner()).to.equal(owner.address); // verificam daca proprietarul contractului este corect setat
    });

    it("Should receive and store the funds to lock", async function () {
      const { lock, lockedAmount } = await loadFixture(deployOneYearLockFixture);

      expect(await ethers.provider.getBalance(lock.target)).to.equal(lockedAmount); // verificam daca fondurile sunt stocate corect in contract
    });

    it("Should fail if the unlockTime is not in the future", async function () {
      // nu folosim fixture pentru ca vrem o implementare diferita
      const latestTime = await time.latest();
      const Lock = await ethers.getContractFactory("Lock");
      await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith("Unlock time should be in the future"); // verificam daca contractul respinge timpul incorect
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);

        await expect(lock.withdraw()).to.be.revertedWith("You can't withdraw yet"); // verificam daca retragerea este blocata inainte de timpul de deblocare
      });

      it("Should revert with the right error if called from another account", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(deployOneYearLockFixture);

        // crestem timpul pe blockchain pentru a ajunge la momentul de deblocare
        await time.increaseTo(unlockTime);

        // folosim lock.connect() pentru a incerca retragerea din alt cont
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith("You aren't the owner"); // verificam ca doar proprietarul poate retrage
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

        // avansam timpul pentru a permite retragerea
        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).not.to.be.reverted; // verificam ca proprietarul poate retrage fondurile
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(deployOneYearLockFixture);

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(lockedAmount, anyValue); // verificam ca evenimentul este emis corect
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(deployOneYearLockFixture);

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.changeEtherBalances([owner, lock], [lockedAmount, -lockedAmount]); // verificam ca fondurile sunt transferate corect catre owner
      });
    });
  });
});
