import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../Web3Provider'; // hook pentru gestionarea conexiunii Web3
import { abi as VotingAbi, address as VotingAddress } from '../contracts/Voting'; // importam ABI-ul si adresa contractului Voting
import { abi as AdminAbi, address as AdminAddress } from '../contracts/Admin'; // importam ABI-ul si adresa contractului Admin

const Voting = () => {
    const { signer } = useWeb3(); // obtinem `signer` pentru a interactiona cu contractul
    const [candidateId, setCandidateId] = useState(''); // starea pentru ID-ul candidatului
    const [amount, setAmount] = useState(''); // starea pentru suma platita pentru vot
    const [winner, setWinner] = useState(null); // starea pentru castigatorul votarii
    const [candidates, setCandidates] = useState([]); // starea pentru lista de candidati

    if (!signer) return null; // daca nu exista un `signer`, componenta nu se afiseaza

    // instantiem contractele Voting si Admin utilizand ABI-urile si adresele acestora
    const votingContract = new ethers.Contract(VotingAddress, VotingAbi, signer);
    const adminContract = new ethers.Contract(AdminAddress, AdminAbi, signer);
    
    // functie pentru preluarea listei de candidati din contractul Admin
    const fetchCandidates = async () => {
        try {
            const candidateIds = await adminContract.getAllCandidates(); // obtine lista ID-urilor candidatilor
            console.log(candidateIds);
            const candidateDetails = await Promise.all(
                candidateIds.map(async (id) => {
                    const details = await adminContract.getCandidateDetails(id); // obtine detaliile fiecarui candidat
                    console.log(details);
                    return {
                        id: details[0].toString(), // ID-ul candidatului
                        name: details[2], // numele candidatului
                        candidateAddress: details[1], // adresa candidatului
                        totalVotes: details[3].toString(), // numarul total de voturi
                        state: '0-> eligible, 1->not eligible: ' + details[4].toString() // statusul de eligibilitate
                    };
                })
            );
            setCandidates(candidateDetails); // actualizeaza lista de candidati in UI
        } catch (error) {
            console.error('Error fetching candidates:', error); // afiseaza eroarea in consola daca apare
        }
    };

    // functie pentru inregistrarea unui votant
    const registerVoter = async () => {
        try {
            await votingContract.registerVoter(); // apeleaza functia registerVoter din contract
        } catch (error) {
            console.error('Error registering voter:', error); // afiseaza eroarea in consola daca apare
        }
    };

    // functie pentru a vota un candidat
    const vote = async () => {
        try {
            await votingContract.vote(candidateId, { value: ethers.parseEther(amount) }); // trimite votul impreuna cu valoarea in ETH
        } catch (error) {
            console.error('Error voting:', error); // afiseaza eroarea in consola daca apare
        }
    };

    // functie pentru a determina castigatorul alegerilor
    const findWinner = async () => {
        try {
            const winnerData = await votingContract.getWinner(); // apeleaza functia din contract pentru a obtine castigatorul
            console.log('Winner Data:', winnerData);
            setWinner({
                name: winnerData[0], // numele castigatorului
                address: winnerData[1], // adresa castigatorului
                votes: winnerData[2].toString(), // numarul de voturi (convertit la string)
            });
        } catch (error) {
            console.error('Error finding winner:', error); // afiseaza eroarea in consola daca apare
        }
    };

    return (
        <div>
            <h2>Voting</h2>
            <div>
                <h3>Register Voter</h3>
                <button onClick={registerVoter}>Register</button> {/* buton pentru inregistrarea unui alegator */}
            </div>
            <div>
                <h3>Vote</h3>
                <input type="text" value={candidateId} onChange={(e) => setCandidateId(e.target.value)} placeholder="Candidate ID" />
                <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (ETH)" />
                <button onClick={vote}>Vote</button> {/* buton pentru a vota un candidat */}
            </div>
            <div>
                <h3>Find Winner</h3>
                <button onClick={findWinner}>Find Winner</button> {/* buton pentru a determina castigatorul */}
                {winner && (
                    <div>
                        <p>Winner Name: {winner.name}</p>
                        <p>Winner Address: {winner.address}</p>
                        <p>Winner Votes: {winner.votes}</p>
                    </div>
                )}
            </div>
            <div>
                <h3>All Candidates</h3>
                <button onClick={fetchCandidates}>Fetch Candidates</button> {/* buton pentru a obtine lista de candidati */}
                <ul>
                    {candidates.map((candidate, index) => (
                        <li key={index}>
                            <p>ID: {candidate.id}</p>
                            <p>Name: {candidate.name}</p>
                            <p>Address: {candidate.candidateAddress}</p>
                            <p>Votes: {candidate.totalVotes}</p>
                            <p>State: {candidate.state}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Voting;
