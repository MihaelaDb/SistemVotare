import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';

// cream un context Web3 pentru a gestiona conexiunea la blockchain
const Web3Context = createContext();

// hook personalizat pentru a accesa contextul Web3 in alte componente
export const useWeb3 = () => useContext(Web3Context);

// providerul Web3 care gestioneaza conexiunea la wallet si datele utilizatorului
export const Web3Provider = ({ children }) => {
    const [provider, setProvider] = useState(null); // stocheaza provider-ul Web3
    const [signer, setSigner] = useState(null); // stocheaza semnatarul (utilizatorul conectat)
    const [account, setAccount] = useState(null); // stocheaza adresa contului conectat
    const [balance, setBalance] = useState(null); // stocheaza balanta contului conectat

    // efect care se activeaza cand provider-ul sau contul se schimba
    useEffect(() => {
        if (provider && account) {
            (async () => {
                const balance = await provider.getBalance(account); // obtine balanta contului
                setBalance(ethers.formatEther(balance)); // converteste balanta in ETH
            })();
        }
    }, [provider, account]);

    // functie pentru conectarea la un wallet Web3
    const connectWallet = async () => {
        const web3Modal = new Web3Modal(); // initializeaza Web3Modal pentru conectare
        const instance = await web3Modal.connect(); // conecteaza wallet-ul utilizatorului
        const provider = new ethers.BrowserProvider(instance); // creeaza un provider ethers.js
        const signer = await provider.getSigner(); // obtine semnatarul tranzactiilor
        const account = await signer.getAddress(); // obtine adresa contului conectat

        setProvider(provider); // seteaza provider-ul in state
        setSigner(signer); // seteaza semnatarul in state
        setAccount(account); // seteaza adresa contului in state
    };

    return (
        <Web3Context.Provider value={{ provider, signer, account, balance, connectWallet }}>
            {children} {/* furnizeaza datele Web3 pentru toate componentele copil */}
        </Web3Context.Provider>
    );
};
