
// const {
//     time,
//     loadFixture,
//   } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
//   const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
//   const { expect } = require("chai");
  
//   describe("Lock", function () {
//     // We define a fixture to reuse the same setup in every test.
//     // We use loadFixture to run this setup once, snapshot that state,
//     // and reset Hardhat Network to that snapshot in every test.
//     async function deployPostDatedCheck() {
//       const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
//       const ONE_GWEI = 1_000_000_000;
  
//       const lockedAmount = ONE_GWEI;
//       const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
  
//       // Contracts are deployed using the first signer/account by default
//       const [owner, otherAccount] = await ethers.getSigners();
  
//       const PostDatedCheck = await ethers.getContractFactory("PostDatedCheck");
//       const postDatedCheck = await PostDatedCheck.deploy(unlockTime, { value: lockedAmount });
  
//       return { lock, unlockTime, lockedAmount, owner, otherAccount };
//     }
    
//     // asyncronous transactions
//     describe("Complete transaction", function () {
//         // it should create a payment struct for a receiver with a specified time
//         // the contract should escrow the amount
//         // the amount should be given to the receiver after specified time
//     });
  
//     describe("Withdrawals", function () {
//       describe("Validations", function () {
//         it("Should revert with the right error if called too soon", async function () {
//           const { lock } = await loadFixture(deployOneYearLockFixture);
  
//           await expect(lock.withdraw()).to.be.revertedWith(
//             "You can't withdraw yet"
//           );
//         });
  
//         it("Should revert with the right error if called from another account", async function () {
//           const { lock, unlockTime, otherAccount } = await loadFixture(
//             deployOneYearLockFixture
//           );
  
//           // We can increase the time in Hardhat Network
//           await time.increaseTo(unlockTime);
  
//           // We use lock.connect() to send a transaction from another account
//           await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
//             "You aren't the owner"
//           );
//         });
  
//         it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
//           const { lock, unlockTime } = await loadFixture(
//             deployOneYearLockFixture
//           );
  
//           // Transactions are sent using the first signer by default
//           await time.increaseTo(unlockTime);
  
//           await expect(lock.withdraw()).not.to.be.reverted;
//         });
//       });
  
//       describe("Events", function () {
//         it("Should emit an event on withdrawals", async function () {
//           const { lock, unlockTime, lockedAmount } = await loadFixture(
//             deployOneYearLockFixture
//           );
  
//           await time.increaseTo(unlockTime);
  
//           await expect(lock.withdraw())
//             .to.emit(lock, "Withdrawal")
//             .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
//         });
//       });
  
//       describe("Transfers", function () {
//         it("Should transfer the funds to the owner", async function () {
//           const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
//             deployOneYearLockFixture
//           );
  
//           await time.increaseTo(unlockTime);
  
//           await expect(lock.withdraw()).to.changeEtherBalances(
//             [owner, lock],
//             [lockedAmount, -lockedAmount]
//           );
//         });
//       });
//     });
//   });
  
const { ethers } = require("hardhat");
const { assert } = require("chai");

describe("PostDatedCheck Contract", function () {
  let PostDatedCheck, postDatedCheck, owner, addr1, addr2;

  beforeEach(async () => {
    PostDatedCheck = await ethers.getContractFactory("PostDatedCheck");
    [owner, addr1, addr2] = await ethers.getSigners();
    postDatedCheck = await PostDatedCheck.deploy();
  });

  describe("Scenario 1: Setting Up a Rent Payment Plan", function () {
    it("Should allow the landlord to create and execute a post-dated payment for rent", async function () {
      const initialBalance = ethers.utils.parseEther("1.0");
      const rentAmount = ethers.utils.parseEther("0.1");

      // Step 1: Landlord deploys the contract and funds it
      await postDatedCheck.connect(owner).deposit({ value: initialBalance });

      // Check contract balance
      let contractBalance = await postDatedCheck.getBalance();
      assert.equal(contractBalance.toString(), initialBalance.toString(), "Initial balance is incorrect");

      // Step 2: Landlord creates a post-dated payment
      const futureDate = Math.floor(new Date().getTime() / 1000) + 60; // 60 seconds from now
      await postDatedCheck.connect(owner).createPayment(addr1.address, rentAmount, futureDate);

      // Step 3: Tenant tries to execute payment before the date (should fail)
      try {
        await postDatedCheck.connect(addr1).executePayment(0);
        assert.fail("Should not allow execution before the date");
      } catch (err) {
        assert.ok("Cannot execute payment before the date");
      }

      // Wait until the future date
      await new Promise(resolve => setTimeout(resolve, 61000)); // Waiting for 61 seconds

      // Tenant executes the payment on or after the date
      await postDatedCheck.connect(addr1).executePayment(0);

      // Check contract balance (should be reduced by the rent amount)
      contractBalance = await postDatedCheck.getBalance();
      assert.equal(contractBalance.toString(), ethers.utils.parseEther("0.9").toString(), "Final balance is incorrect");
    });
  });
});