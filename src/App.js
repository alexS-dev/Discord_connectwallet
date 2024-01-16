import * as React from "react";
import { getAddress } from "sats-connect";

import logo from "./logo.svg";
import "./App.css";
import { useState, useEffect } from "react";

function App() {
  // Initial Settings
  const NETWORK = "Mainnet";
  const [BISON_SEQUENCER_ENDPOINT, setBISON_SEQUENCER_ENDPOINT] = useState(
    "https://app.bisonlabs.io/sequencer_endpoint"
  );
  const [BOT_ENDPOINT, setBOT_ENDPOINT] = useState("http://45.61.131.22:5000");
  const [ordinalsAddress, setOrdinalsAddress] = useState("");
  const [contracts, setContracts] = useState([]);
  const [tokenBalances, setTokenBalances] = useState("");
  const [LABBBlance, setLABBBlance] = useState("");
  const [btcBlance, setBtcBlance] = useState(0);

  // Connect Wallet Button Click
  const onConnectClick = async () => {
    const getAddressOptions = {
      payload: {
        purposes: ["ordinals", "payment"],
        message: "Address for receiving Ordinals",
        network: {
          type: NETWORK,
        },
      },
      onFinish: async (response) => {
        setOrdinalsAddress(response.addresses[0].address);
      },
      onCancel: () => alert("Request Cancel"),
    };

    if (!ordinalsAddress) await getAddress(getAddressOptions);
    // 如果您有fetchContracts函数，请取消下面这行的注释
    // this.fetchContracts();
    // connectWallet(ordinalsAddress, ordinalsPublicKey);
    // updateWalletInfo(ordinalsAddress, ordinalsPublicKey);
  };

  // Disconnect Wallet Button Click
  const onDisconnectClick = async () => {
    setOrdinalsAddress(undefined);
  };

  const checkHolder = async () => {
    try {
      const response = await fetch(`${BOT_ENDPOINT}`);
      const data = await response.json();
      console.log("UserID ", data.userId);
      console.log("LABB Balance ", tokenBalances.labb / 100000000);

      // Check if 'data' contains the userId and the balance is more than 100
      if (data && data.userId) {
        // Post the userId to BOT_ENDPOINT/holders
        await fetch(`${BOT_ENDPOINT}/holders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ holderId: data.userId }),
        });

        console.log("HolderID:", data.userId, "posted to BOT_ENDPOINT/holders");
      } else {
        console.log("UserId or balance does not meet the criteria.");
      }
    } catch (error) {
      console.error("Error fetching or processing data:", error);
    }
  };

  useEffect(() => {
    checkHolder();
  }, [ordinalsAddress]);

  // Fetch Contracts
  const fetchBalanceForContract = async (contract) => {
    const url = `${contract.contractEndpoint}/balance`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address: ordinalsAddress }),
    })
      .then((response) => response.json())
      .then((data) => {
        setTokenBalances((prevTokenBalances) => ({
          ...prevTokenBalances,
          [contract.tick]: data.balance,
        }));
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const fetchContracts = async () => {
    const response = await fetch(`${BISON_SEQUENCER_ENDPOINT}/contracts_list`);
    const data = await response.json();

    // Filter contracts that are of type "Token"
    const tokenContracts = data.contracts.filter(
      (contract) => contract.contractType === "Token"
    );

    // Fetch the balance for each token contract
    for (let contract of tokenContracts) {
      await fetchBalanceForContract(contract);
    }

    setContracts(tokenContracts);
    checkHolder();
  };

  useEffect(() => {
    fetchContracts();
  }, [ordinalsAddress]);

  // Check LABB Holder

  return (
    <div className="App">
      {!ordinalsAddress && (
        <div>
          <p className="">Connect your Xverse Wallet</p>
          <button onClick={onConnectClick} className="Button-Style">
            {/* <img src="/connection-icon.svg" alt="Connect-Logo" className="" /> */}
            Connect Wallet
          </button>
        </div>
      )}

      {ordinalsAddress && (
        <div>
          <p className="">Your Xverse Wallet Connected</p>
          <button onClick={onDisconnectClick} className="Button-Style">
            Disconnect
          </button>
          <p>Wallet Address: {ordinalsAddress}</p>
          <p>
            LABB Blance:{" "}
            {contracts.map((contract, index) => {
              const balance =
                contract.tick === "LABB"
                  ? parseFloat(
                      (tokenBalances[contract.tick] || 0) / 100000000
                    ).toFixed(8)
                  : tokenBalances[contract.tick] || 0;
              return balance;
            })}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
