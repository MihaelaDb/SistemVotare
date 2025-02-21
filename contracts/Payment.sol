// contracts/Payment.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol"; // importam Ownable pentru restrictii de acces

contract Payment is Ownable {
    
    mapping(address => uint) public votesPaid;  // mapare pentru numarul de voturi platite de fiecare votant
    uint public votingFee; // taxa pentru vot platit
    uint public maxPaidVotes; // numarul maxim de voturi platite permise
    uint public maxFreeVotes; // numarul maxim de voturi gratuite permise

    // evenimente pentru notificari cand se actualizeaza date importante
    event MaxPaidVotesUpdated(uint _updatedNumber);
    event PaymentReceived(address indexed payer);
    event FeeUpdated(uint _votingFee);
    event WinnerPaid(uint totalCollectedFees);

    // modifier care verifica daca numarul de voturi gratuite este mai mic decat cel al voturilor platite
    modifier validNumberVotesRange(uint _maxFreeVotes, uint _maxPaidVotes){
        require(_maxFreeVotes < _maxPaidVotes, "Invalid range of free/paid votes");
        _;
    }

    // constructor care seteaza initial owner-ul, taxa de vot si limitele voturilor
    constructor(address initialOwner, uint _initialFee, uint _maxFreeVotes, uint _maxPaidVotes) 
        Ownable(initialOwner) 
        validNumberVotesRange(_maxFreeVotes, _maxPaidVotes) 
    {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0)); // verificam daca owner-ul este valid
        }
        votingFee = _initialFee;   
        maxFreeVotes = _maxFreeVotes;
        maxPaidVotes = _maxPaidVotes;
    }

    // functia pentru plata unui vot
    function payToVote(address voter) external payable {
        require(msg.value >= votingFee, "Not enough ETH sent"); // verificam daca utilizatorul a trimis suficienti ETH
        if (msg.value > votingFee) {
            (bool sent, ) = payable(voter).call{value: msg.value - votingFee}(""); // returnam excesul de ETH
            require(sent, "Failed to send the extra Ether back");
        }

        votesPaid[voter] += 1; // crestem numarul de voturi platite pentru utilizator
        emit PaymentReceived(voter); // emitem evenimentul de plata
    }

    // permite owner-ului sa actualizeze taxa de vot
    function updateFees(uint _updatedFee) external onlyOwner {
        votingFee = _updatedFee;
        emit FeeUpdated(votingFee);
    }

    // permite owner-ului sa actualizeze numarul maxim de voturi platite
    function updateMaxPaidVotes(uint _maxPaidVotes) external onlyOwner {
        maxPaidVotes = _maxPaidVotes;
        emit MaxPaidVotesUpdated(maxPaidVotes);
    }

    // functie pentru verificarea numarului total de voturi platite de un utilizator
    function getTotalPaidVotes(address voter) external view returns (uint) {
        return votesPaid[voter];
    }

    // permite owner-ului sa plateasca castigatorul cu toate fondurile colectate
    function releaseFunds(address winner) external onlyOwner {
        uint totalCollectedFees = address(this).balance; // obtinem soldul contractului
        require(totalCollectedFees > 0, "No funds to distribute"); // verificam daca sunt fonduri disponibile
        payable(winner).transfer(totalCollectedFees); // transferam fondurile catre castigator
        emit WinnerPaid(totalCollectedFees); // emitem evenimentul de plata catre castigator
    }
}
