// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol"; // importam Ownable pentru gestionarea permisiunilor

// interfata pentru interactiunea cu contractul Admin
interface IAdmin {
    function verifyCandidateEligibility(uint _candidateId) external view returns (bool); // verifica daca un candidat este eligibil
    function increaseCandidateVotes(uint _id) external returns (uint); // creste numarul de voturi pentru un candidat
    function votingEnd() external view returns (uint); // returneaza timpul de sfarsit al votarii
    function votingStart() external view returns (uint); // returneaza timpul de inceput al votarii
    function findBestCandidate() external view returns (string memory name, address candidateAddress, uint finalVotes); // gaseste candidatul cu cele mai multe voturi
    function getCandidateDetails(uint _candidateId) external view returns (string memory name, address candidateAddress); // returneaza detaliile unui candidat
    function getAllCandidates() external view returns (uint[] memory); // returneaza lista tuturor candidatilor
}

// interfata pentru interactiunea cu contractul Payment
interface IPayment {
    function payToVote(address voter) external payable; // permite utilizatorilor sa plateasca pentru voturi suplimentare
    function getTotalPaidVotes(address voter) external view returns (uint); // returneaza numarul total de voturi platite de un utilizator
    function releaseFunds(address winner) external; // transfera fondurile castigatorului
    function maxPaidVotes() external view returns (uint); // returneaza numarul maxim de voturi platite permise
    function maxFreeVotes() external view returns (uint); // returneaza numarul maxim de voturi gratuite permise
    function votingFee() external view returns (uint); // returneaza taxa de vot platit
}

// contract pentru gestionarea procesului de votare
contract Voting is Ownable {
    IAdmin admin; // referinta catre contractul Admin
    IPayment payment; // referinta catre contractul Payment

    mapping(address => Voter) public voters; // mapare pentru informatiile despre alegatori

    // structura pentru alegatori
    struct Voter {
        bool isRegistered; // verifica daca alegatorul este inregistrat
        uint votes; // numarul total de voturi exprimate
        uint[] candidatesId; // lista id-urilor candidatilor votati
    }

    // constructor care initializeaza contractul cu adresele admin si payment
    constructor(address initialOwner, address _admin, address _payment) Ownable(initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0)); // verificam daca adresa owner-ului este valida
        }
        admin = IAdmin(_admin);
        payment = IPayment(_payment);
    }

    // evenimente pentru monitorizarea procesului electoral
    event VoterRegistered(address voter);
    event VotedSuccessfully(address voter, uint candidateId);
    event WinnerDeclared(string winnerName, address winnerAddress, uint winnerVotes);
    event DebugTimestamp(uint votingEnd, uint currentTimestamp);

    error InvalidVote(); // eroare pentru vot invalid

    // modifier care restrictioneaza actiunile la perioada de votare
    modifier onlyDuringVotingPeriod() {
        require(block.timestamp >= admin.votingStart() && block.timestamp <= admin.votingEnd(), "Outside voting period!");
        _;
    }

    // modifier care verifica daca alegatorul este inregistrat
    modifier validVoter(address voterAddress) {
        require(voters[voterAddress].isRegistered, "Voter not registered!");
        _;
    }

    // functie pentru inregistrarea alegatorilor
    function registerVoter() public onlyDuringVotingPeriod {
        require(!voters[msg.sender].isRegistered, "Voter already registered"); // verificam daca alegatorul nu este deja inregistrat
        voters[msg.sender].isRegistered = true;
        voters[msg.sender].votes = 0;
        emit VoterRegistered(msg.sender); // emitem evenimentul de inregistrare
    }

    // functie pentru a vota un candidat
    function vote(uint _candidateId) external onlyDuringVotingPeriod validVoter(msg.sender) payable {
        require(admin.verifyCandidateEligibility(_candidateId), "Candidate not eligible"); // verificam daca candidatul este eligibil
        if (findPaidVotesLeft() == 0) {
            revert InvalidVote(); // daca utilizatorul nu mai are voturi disponibile, anulam tranzactia
        }

        if (voters[msg.sender].votes < payment.maxFreeVotes()) {
            addVotes(_candidateId, msg.sender); // utilizatorul voteaza gratuit
        } else {
            payment.payToVote{value: msg.value}(msg.sender); // utilizatorul plateste pentru vot suplimentar
            addVotes(_candidateId, msg.sender);
        }
    }

    // functie interna pentru a adauga voturi candidatilor
    function addVotes(uint _candidateId, address _voterAddress) private {
        admin.increaseCandidateVotes(_candidateId); // crestem numarul de voturi pentru candidat
        voters[_voterAddress].votes += 1; // inregistram votul pentru utilizator
        voters[_voterAddress].candidatesId.push(_candidateId); // salvam ID-ul candidatului votat
        emit VotedSuccessfully(_voterAddress, _candidateId); // emitem evenimentul de votare
    }

    // functie pentru verificarea numarului de voturi platite ramase
    function findPaidVotesLeft() public view validVoter(msg.sender) returns (uint rest) {
        uint totalPaidVotes = payment.getTotalPaidVotes(msg.sender); // obtinem numarul total de voturi platite
        uint votesLeft = payment.maxPaidVotes() - totalPaidVotes; // calculam cate voturi platite mai poate face utilizatorul
        return votesLeft;
    }

    // functie pentru declararea castigatorului dupa terminarea perioadei de vot
    function declareWinner() external onlyOwner {
        require(admin.votingEnd() < block.timestamp, "Winner is declared after voting period ended!"); // verificam daca perioada de vot s-a incheiat
        (string memory winnerName, address winnerAddress, uint winnerVotes) = admin.findBestCandidate(); // gasim candidatul cu cele mai multe voturi
        emit WinnerDeclared(winnerName, winnerAddress, winnerVotes); // emitem evenimentul de castigare
    }

    // functie pentru obtinerea castigatorului fara a modifica blockchain-ul
    function getWinner() external view returns (string memory name, address candidateAddress, uint totalVotes) {
        uint end = admin.votingEnd();
        uint current = block.timestamp;
        require(end < current, "Winner is declared after voting period ended!"); // verificam daca votarea s-a terminat
        return admin.findBestCandidate(); // returnam castigatorul
    }

    // functie pentru verificarea taxei pentru voturile platite
    function checkFeeForPaidVotes() external view returns (uint fee) {
        return payment.votingFee();
    }

    // functie pentru verificarea numarului total de voturi efectuate de un utilizator
    function checkVotesPerVoter() public view returns (uint votedTimes) {
        return (voters[msg.sender].votes);
    }

    // functie pentru returnarea listei tuturor candidatilor
    function getAllCandidates() external returns (uint[] memory) {
        return admin.getAllCandidates();
    }
}
