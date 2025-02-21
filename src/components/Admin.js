/* eslint-disable no-undef */
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../Web3Provider'; // hook pentru gestionarea conexiunii Web3
import { abi as AdminAbi, address as AdminAddress } from '../contracts/Admin'; // importam ABI-ul si adresa contractului Admin
import Datetime from 'react-datetime'; // librarie pentru selectarea datei si orei
import 'react-datetime/css/react-datetime.css'; // stiluri pentru componenta Datetime
import moment from 'moment'; // librarie pentru manipularea timpului

const Admin = () => {
    const { signer } = useWeb3(); // obtinem `signer` pentru a interactiona cu contractul
    const [votingStart, setVotingStart] = useState(''); // starea pentru timpul de inceput al votarii
    const [votingEnd, setVotingEnd] = useState(''); // starea pentru timpul de sfarsit al votarii
    const [candidateName, setCandidateName] = useState(''); // starea pentru numele candidatului
    const [candidateAddress, setCandidateAddress] = useState(''); // starea pentru adresa candidatului
    const [candidateId, setCandidateId] = useState(''); // starea pentru ID-ul candidatului

    if (!signer) return null; // daca nu exista un signer, nu afisam componenta

    // instantiem contractul Admin utilizand ABI-ul si adresa acestuia
    const adminContract = new ethers.Contract(AdminAddress, AdminAbi, signer);

    // functie pentru actualizarea perioadei de votare
    const updateVotingPeriod = async () => {
        try {
            const startTimestamp = moment(votingStart).unix(); // convertim data de start in timestamp
            const endTimestamp = moment(votingEnd).unix(); // convertim data de sfarsit in timestamp
            await adminContract.updateVotingPeriod(BigInt(startTimestamp), BigInt(endTimestamp)); // apelam functia din contract
        } catch (error) {
            console.error('Error updating voting period:', error); // afisam eroarea in consola daca apare
        }
    };

    // functie pentru adaugarea unui nou candidat
    const addCandidate = async () => {
        try {
            await adminContract.addCandidate(candidateName, candidateAddress); // apelam functia addCandidate din contract
            console.log('Candidate added successfully'); // mesaj de succes in consola
        } catch (error) {
            console.error('Error adding candidate:', error); // afisam eroarea in consola daca apare
        }
    };

    // functie pentru dezactivarea unui candidat
    const deactivateCandidate = async () => {
        try {
            await adminContract.deactivateCandidate(candidateId); // apelam functia deactivateCandidate din contract
        } catch (error) {
            console.error('Error deactivating candidate:', error); // afisam eroarea in consola daca apare
        }
    };

    return (
        <div>
            <h2>Admin</h2>
            <div>
                <h3>Update Voting Period</h3>
                <label>Start Time</label>
                <Datetime 
                    value={votingStart} 
                    onChange={(date) => setVotingStart(date)} 
                    dateFormat="YYYY-MM-DD" 
                    timeFormat="HH:mm:ss" 
                    inputProps={{ placeholder: 'YYYY-MM-DD HH:mm:ss' }} // formatul placeholder-ului
                />
                <label>End Time</label>
                <Datetime 
                    value={votingEnd} 
                    onChange={(date) => setVotingEnd(date)} 
                    dateFormat="YYYY-MM-DD" 
                    timeFormat="HH:mm:ss" 
                    inputProps={{ placeholder: 'YYYY-MM-DD HH:mm:ss' }} // formatul placeholder-ului
                />
                <button onClick={updateVotingPeriod}>Update Period</button> {/* buton pentru actualizarea perioadei de vot */}
            </div>
            <div>
                <h3>Add Candidate</h3>
                <input 
                    type="text" 
                    value={candidateName} 
                    onChange={(e) => setCandidateName(e.target.value)} 
                    placeholder="Candidate Name" 
                />
                <input 
                    type="text" 
                    value={candidateAddress} 
                    onChange={(e) => setCandidateAddress(e.target.value)} 
                    placeholder="Candidate Address" 
                />
                <button onClick={addCandidate}>Add Candidate</button> {/* buton pentru adaugarea unui candidat */}
            </div>
            <div>
                <h3>Deactivate Candidate</h3>
                <input 
                    type="text" 
                    value={candidateId} 
                    onChange={(e) => setCandidateId(e.target.value)} 
                    placeholder="Candidate ID" 
                />
                <button onClick={deactivateCandidate}>Deactivate Candidate</button> {/* buton pentru dezactivarea unui candidat */}
            </div>
        </div>
    );
};

export default Admin;
