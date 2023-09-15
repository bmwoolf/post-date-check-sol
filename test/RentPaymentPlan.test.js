
const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { ethers } = require("hardhat");
const { assert, expect } = require("chai");

describe("PostDatedCheck Contract", function () {
    let PostDatedCheck, postDatedCheck, owner, addr1, addr2;

    beforeEach(async () => {
        PostDatedCheck = await ethers.getContractFactory("PostDatedCheck");
        [owner, addr1, addr2] = await ethers.getSigners();
        postDatedCheck = await PostDatedCheck.deploy();
    });

    // create amount
    // add specified date to pull money
    // accelerate time based on accelerating the blocks
    // pull amount from payer once time is hit and direct to receiver
        // probably need a 

    describe("Scenario 1: Setting Up a Rent Payment Plan", function () {
        it("Should allow the payer to create and execute a post-dated payment for rent", async function () {
            // console.log("ethers", ethers)
            const initialBalance = ethers.parseEther("1.0");
            const rentAmount = ethers.parseEther("0.1");

            // Step 1: payer deploys the contract and funds it
            await postDatedCheck.connect(owner).deposit({ value: initialBalance });

            // Check contract balance
            let contractBalance = await postDatedCheck.getBalance();
            assert.equal(contractBalance.toString(), initialBalance.toString(), "Initial balance is incorrect");

            // Step 2: payer creates a post-dated payment
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