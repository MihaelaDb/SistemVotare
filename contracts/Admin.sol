// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol"; // importam contractul Ownable pentru gestionarea permisiunilor

contract Admin is Ownable {

    enum State {Eligible, Ineligible} // definim doua stari pentru un candidat: eligibil si ineligibil
    struct Candidate {
        uint id; // identificatorul unic al candidatului
        address candidateAddress; // adresa candidatului
        string name; // numele candidatului
        uint totalVotes; // numarul total de voturi primite
        State state; // starea actuala a candidatului (eligibil sau ineligibil)
    }
    
    uint public votingStart; // momentul de start al perioadei de votare
    uint public votingEnd; // momentul de sfarsit al perioadei de votare
    mapping(uint => Candidate) public idToCandidate; // mapare de la id-ul candidatului la structura acestuia
    uint public nextCandidateId; // urmeaza ID-ul noului candidat
    Candidate[] public candidateList; // lista tuturor candidatilor

    modifier validRange(uint _startTime, uint _endTime){
        require(_startTime < _endTime, "Start time must be before end time."); // validam intervalul de timp al votarii
        _;
    }

    modifier validCandidateId(uint _id){
        require(_id > 0 && _id < nextCandidateId, "Candidate ID out of range"); // verificam daca ID-ul candidatului este valid
        _;
    }

    event VotingPeriodUpdated(uint start, uint end); // eveniment pentru actualizarea perioadei de votare
    event CandidateAdded(uint candidateId, string name); // eveniment pentru adaugarea unui nou candidat
    event CandidateDeactivated(uint candidateId); // eveniment pentru dezactivarea unui candidat

    constructor(address initialOwner, string memory initialCandidateName, address initialCandidateAddress) Ownable(initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0)); // validam adresa owner-ului
        }
        nextCandidateId = 1;
        // adaugam un candidat initial
        Candidate memory initialCandidate = Candidate({
            id: nextCandidateId,
            candidateAddress: initialCandidateAddress,
            name: initialCandidateName,
            totalVotes: 0,
            state: State.Eligible
        });
        idToCandidate[nextCandidateId] = initialCandidate; // adaugam candidatul in mapare
        candidateList.push(initialCandidate); // adaugam candidatul in lista
        emit CandidateAdded(initialCandidate.id, initialCandidate.name); // emitem evenimentul de adaugare
        nextCandidateId++;
    }

    function updateVotingPeriod(uint _start, uint _end) external onlyOwner {
        votingStart = _start; // setam ora de inceput a votarii
        votingEnd = _end; // setam ora de sfarsit a votarii
        emit VotingPeriodUpdated(_start, _end); // emitem evenimentul de actualizare a perioadei de vot
    }
    
    function addCandidate(string memory _name, address _candidateAddress) external onlyOwner {
        uint candidateId = nextCandidateId++; // atribuim un ID nou candidatului
        Candidate memory newCandidate = Candidate(candidateId, _candidateAddress, _name, 0, State.Eligible);
        idToCandidate[candidateId] = newCandidate; // salvam candidatul in mapare
        candidateList.push(newCandidate); // salvam candidatul in lista
        emit CandidateAdded(newCandidate.id, newCandidate.name); // emitem evenimentul de adaugare
    }

    function deactivateCandidate(uint _candidateId) external onlyOwner validCandidateId(_candidateId) {
        Candidate storage candidate = idToCandidate[_candidateId];
        candidate.state = State.Ineligible; // marcam candidatul ca ineligibil
        candidateList[_candidateId - 1].state = State.Ineligible; // actualizam si in lista
        emit CandidateDeactivated(_candidateId); // emitem evenimentul de dezactivare
    }

    function increaseCandidateVotes(uint _id) external returns (uint){
        require(_id > 0 && _id < nextCandidateId, "Candidate ID out of range"); // verificam daca ID-ul este valid
        idToCandidate[_id].totalVotes += 1; // crestem numarul de voturi al candidatului
        candidateList[_id - 1].totalVotes += 1; // actualizam si in lista
        return idToCandidate[_id].totalVotes; // returnam noul numar de voturi
    }

    function getCandidateDetails(uint _candidateId) public view returns (
        uint id,
        address candidateAddress,
        string memory name,
        uint votesCount,
        State state
    ) {
        Candidate memory candidate = getCandidateById(_candidateId);
        return(candidate.id, candidate.candidateAddress, candidate.name, candidate.totalVotes, candidate.state); // returnam detaliile unui candidat
    }

    function verifyCandidateEligibility (uint _candidateId) external view returns (bool){
        (,,,,State state) = getCandidateDetails(_candidateId);
        if(state == State.Eligible){
            return true; // returneaza true daca candidatul este eligibil
        } 
        return false;
    }

    function getCandidateById(uint _id) private view validCandidateId(_id) returns (Candidate memory){
        return idToCandidate[_id]; // returnam candidatul dupa ID
    }

    function sortCandidates(Candidate[] memory candidates) internal pure returns (Candidate[] memory) {
        uint n = candidates.length;
        for (uint i = 0; i < n; i++) {
            for (uint j = i + 1; j < n; j++) {
                if (candidates[i].totalVotes < candidates[j].totalVotes) {
                    (candidates[i], candidates[j]) = (candidates[j], candidates[i]); // schimbam locul candidatilor daca este necesar
                }
            }
        }
        return candidates; // returnam lista sortata dupa numarul de voturi
    }

    function findBestCandidate() external view returns (string memory name, address candidateAddress, uint finalVotes) {
        Candidate[] memory sortedCandidates = new Candidate[](candidateList.length);
        for (uint i = 0; i < candidateList.length; i++) {
            sortedCandidates[i] = candidateList[i]; // copiem lista de candidati
        }

        sortedCandidates = sortCandidates(sortedCandidates); // sortam lista dupa voturi

        // gasim primul candidat eligibil
        for (uint i = 0; i < sortedCandidates.length; i++) {
            if (sortedCandidates[i].state == State.Eligible) {
                return (sortedCandidates[i].name, sortedCandidates[i].candidateAddress, sortedCandidates[i].totalVotes);
            }
        }

        revert("No eligible winner found."); // daca nu gasim un candidat eligibil, revert
    }

    function getAllCandidates() external view returns (uint[] memory) {
        uint[] memory candidateIds = new uint[](candidateList.length);
        for (uint i = 0; i < candidateList.length; i++) {
            candidateIds[i] = candidateList[i].id; // colectam ID-urile tuturor candidatilor
        }
        return candidateIds; // returnam lista cu ID-uri
    }
}
