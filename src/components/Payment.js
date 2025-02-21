import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../Web3Provider'; // hook pentru gestionarea conexiunii Web3
import { abi as PaymentAbi, address as PaymentAddress } from '../contracts/Payment'; // importam ABI-ul si adresa contractului Payment

const Payment = () => {
    const { signer } = useWeb3(); // obtinem `signer` pentru a interactiona cu contractul
    const [voterAddress, setVoterAddress] = useState(''); // starea pentru adresa votantului
    const [votingFee, setVotingFee] = useState(''); // starea pentru taxa de vot
    const [maxPaidVotes, setMaxPaidVotes] = useState(''); // starea pentru numarul maxim de voturi platite
    const [amount, setAmount] = useState(''); // starea pentru suma platita pentru vot
    const [totalPaidVotes, setTotalPaidVotes] = useState(''); // starea pentru numarul total de voturi platite
    const [winnerAddress, setWinnerAddress] = useState(''); // starea pentru adresa castigatorului

    if (!signer) return null; // daca nu exista un `signer`, componenta nu se afiseaza

    // instantiem contractul Payment utilizand ABI-ul si adresa acestuia
    const paymentContract = new ethers.Contract(PaymentAddress, PaymentAbi, signer);

    // functie pentru plata unui vot
    const payToVote = async () => {
        try {
            await paymentContract.payToVote(voterAddress, { value: ethers.parseEther(amount) }); // trimite ETH pentru vot
        } catch (error) {
            console.error('Error paying to vote:', error); // afiseaza eroarea in consola daca apare
        }
    };

    // functie pentru actualizarea taxei de vot
    const updateFees = async () => {
        try {
            await paymentContract.updateFees(ethers.parseEther(votingFee)); // seteaza noua taxa de vot
        } catch (error) {
            console.error('Error updating fees:', error); // afiseaza eroarea in consola daca apare
        }
    };

    // functie pentru actualizarea numarului maxim de voturi platite
    const updateMaxPaidVotes = async () => {
        try {
            await paymentContract.updateMaxPaidVotes(maxPaidVotes); // seteaza noua limita de voturi platite
        } catch (error) {
            console.error('Error updating max paid votes:', error); // afiseaza eroarea in consola daca apare
        }
    };

    // functie pentru verificarea numarului total de voturi platite de un utilizator
    const getTotalPaidVotes = async () => {
        try {
            const votes = await paymentContract.getTotalPaidVotes(voterAddress); // obtine numarul de voturi platite
            setTotalPaidVotes(votes.toString()); // actualizeaza starea cu valoarea returnata
        } catch (error) {
            console.error('Error getting total paid votes:', error); // afiseaza eroarea in consola daca apare
        }
    };

    // functie pentru distribuirea fondurilor catre castigator
    const releaseFunds = async () => {
        try {
            await paymentContract.releaseFunds(winnerAddress); // trimite fondurile castigatorului
        } catch (error) {
            console.error('Error releasing funds:', error); // afiseaza eroarea in consola daca apare
        }
    };

    return (
        <div>
            <h2>Payment</h2>
            <div>
                <h3>Pay to Vote</h3>
                <input type="text" value={voterAddress} onChange={(e) => setVoterAddress(e.target.value)} placeholder="Voter Address" />
                <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (ETH)" />
                <button onClick={payToVote}>Pay to Vote</button> {/* buton pentru plata unui vot */}
            </div>
            <div>
                <h3>Update Voting Fee</h3>
                <input type="text" value={votingFee} onChange={(e) => setVotingFee(e.target.value)} placeholder="New Fee (ETH)" />
                <button onClick={updateFees}>Update Fee</button> {/* buton pentru actualizarea taxei de vot */}
            </div>
            <div>
                <h3>Update Max Paid Votes</h3>
                <input type="text" value={maxPaidVotes} onChange={(e) => setMaxPaidVotes(e.target.value)} placeholder="Max Paid Votes" />
                <button onClick={updateMaxPaidVotes}>Update Max Paid Votes</button> {/* buton pentru actualizarea numarului maxim de voturi platite */}
            </div>
            <div>
                <h3>Get Total Paid Votes</h3>
                <input type="text" value={voterAddress} onChange={(e) => setVoterAddress(e.target.value)} placeholder="Voter Address" />
                <button onClick={getTotalPaidVotes}>Get Total Paid Votes</button> {/* buton pentru a obtine numarul de voturi platite */}
                {totalPaidVotes && <p>Total Paid Votes: {totalPaidVotes}</p>} {/* afiseaza numarul total de voturi platite */}
            </div>
            <div>
                <h3>Release Funds to Winner</h3>
                <input type="text" value={winnerAddress} onChange={(e) => setWinnerAddress(e.target.value)} placeholder="Winner Address" />
                <button onClick={releaseFunds}>Release Funds</button> {/* buton pentru distribuirea fondurilor castigatorului */}
            </div>
        </div>
    );
};

export default Payment;
