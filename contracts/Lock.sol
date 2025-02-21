// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Lock {
    uint public unlockTime; // timpul cand fondurile pot fi retrase
    address payable public owner; // adresa owner-ului care poate retrage fondurile

    event Withdrawal(uint amount, uint when); // eveniment emis la retragerea fondurilor

    constructor(uint _unlockTime) payable {
        require(
            block.timestamp < _unlockTime, // verificam daca timpul de deblocare este in viitor
            "unlock time should be in the future"
        );

        unlockTime = _unlockTime; // setam timpul de deblocare
        owner = payable(msg.sender); // salvam adresa owner-ului
    }

    function withdraw() public {
        // decomenteaza linia de mai jos pentru a afisa loguri in terminal
        // console.log("unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);

        require(block.timestamp >= unlockTime, "you can't withdraw yet"); // verificam daca perioada de blocare a expirat
        require(msg.sender == owner, "you aren't the owner"); // verificam daca doar owner-ul poate retrage fondurile

        emit Withdrawal(address(this).balance, block.timestamp); // emitem evenimentul de retragere

        owner.transfer(address(this).balance); // transferam toate fondurile catre owner
    }
}
