// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract PostDatedCheck {
    
    // payment details
    struct Payment {
        address payable recipient;
        uint256 amount;
        uint256 date;
        bool executed;
    }

    uint256 public paymentCount;
    mapping(uint256 => Payment) public payments;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        _;
        require(msg.sender == owner, "Not the contract owner");
    }

    // create payment based on date
    // note: no money is pulled from the payer's account. just an obligation
    function createPayment(address payable _recipient, uint256 _amount,  uint256 _date) public onlyOwner {
        payments[paymentCount] = Payment({
            recipient: _recipient,
            amount: _amount,
            date: _date, 
            executed: false
        });

        paymentCount += 1;
    }

    // execute the payment
    // should pull, not require them to deposit into the escrow
    // need logic for if the payer does not have the funds
    function executePayment(uint256 _id) public {
        Payment storage payment = payments[_id];

        require(address(this).balance >= payment.amount, "Insufficient balance");
        require(block.timestamp >= payment.date, "Date not reached");
        require(!payment.executed, "Payment already executed");

        payment.recipient.transfer(payment.amount);
        payment.executed = true;
    }

    function deposit() public payable {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}