import React from 'react';
import { Web3Provider, useWeb3 } from './Web3Provider';
import Admin from './components/Admin';
import Payment from './components/Payment';
import Voting from './components/Voting';

const App = () => {
    return (
        <Web3Provider>
            <Main />
        </Web3Provider>
    );
};

const Main = () => {
    const { connectWallet, account, balance } = useWeb3();

    return (
        <div>
            <h1>Web3 App</h1>
            {account ? (
                <div>
                    <p>Account: {account}</p>
                    <p>Balance: {balance} ETH</p>
                </div>
            ) : (
                <button onClick={connectWallet}>Connect Wallet</button>
            )}
            <Admin />
            <Payment />
            <Voting />
        </div>
    );
};

export default App;
