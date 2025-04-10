import { useState } from "react";
import { wallets as leapWallets } from "@cosmos-kit/leap";
import { wallets as keplrWallets } from "@cosmos-kit/keplr";
import { ChainProvider, useChain } from "@cosmos-kit/react";
import "@interchain-ui/react/styles";
import "./App.css";
import { calcVotes } from "./util/calc-votes";

const chainConfig = {
  chain_id: "unicorn-69",
  chain_name: "unicorn",
  apis: [
    { rpc: ["https://rpc.uwupunks.com"] },
    { rest: ["https://rest.uwupunks.com"] },
  ],
  bech32_config: {
    bech32PrefixAccAddr: "unicorn",
    bech32PrefixAccPub: "unicornpub",
    bech32PrefixValAddr: "unicornvaloper",
    bech32PrefixValPub: "unicornvaloperpub",
    bech32PrefixConsAddr: "unicornvalcons",
    bech32PrefixConsPub: "unicornvalconspub",
  },
  assetList: {
    assets: [
      {
        description: "UWU",
        denom_units: [
          {
            denom: "unicorn",
            exponent: 0,
          },
          {
            denom: "unicorn",
            exponent: 6,
          },
        ],
        base: "unicorn",
        name: "Unicorn",
        display: "unicorn",
        symbol: "UWU",
      },
    ],
  },
  bech32_prefix: "unicorn",
  slip44: 118,
};
const walletChainConfig = {
  chainId: chainConfig.chain_id,
  chainName: chainConfig.chain_name,
  rest: chainConfig.apis[1].rest[0],
  rpc: chainConfig.apis[0].rpc[0],
  bech32Config: chainConfig.bech32_config,
  currencies: [
    {
      coinDenom: "unicorn",
      coinMinimalDenom: "UWU",
      coinDecimals: 6,
      coinGeckoId: "uwu",
    },
  ],
  feeCurrencies: [
    {
      coinDenom: "unicorn",
      coinMinimalDenom: "UWU",
      coinDecimals: 6,
      coinGeckoId: "uwu",
      gasPriceStep: {
        low: 0,
        average: 0,
        high: 0,
      },
    },
  ],
  stakeCurrency: {
    coinDenom: "unicorn",
    coinMinimalDenom: "UWU",
    coinDecimals: 6,
    coinGeckoId: "uwu",
  },
  bip44: {
    coinType: 118, // Example coin type for Cosmos
  },
  coinType: chainConfig.slip44,
  features: ["stargate", "ibc-go", "ibc-transfer", "cosmwasm"],
};
if (window.keplr) {
  window.keplr.experimentalSuggestChain(walletChainConfig);
}
if (window.leap) {
  window.leap.experimentalSuggestChain(walletChainConfig);
}

const processObject = (obj) => {
  const filteredObj = Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== "0")
  );
  return Object.fromEntries(
    Object.entries(filteredObj).map(([key, value]) => [
      key.replace(/factory\/.*\/u/, "u"),
      key !== "address" ? (value / Math.pow(10, 6))?.toFixed(2) : value,
    ])
  );
};

const renderObject = (obj, index, skipProcess = false) => {
  const processedObj = !skipProcess ? processObject(obj) : obj;
  return (
    <div className="data-card" key={index}>
      {Object.entries(processedObj).map(([key, value]) => (
        <div className="key-value-pair" key={key}>
          <span className="key">{key}</span>
          <span className="value">{value}</span>
        </div>
      ))}
    </div>
  );
};

function WalletConnectedApp({ chainName }) {
  const { address, wallet, connect, disconnect, getOfflineSignerAmino } =
    useChain(chainName);
  const [balances, setBalances] = useState("");
  const [voted, setVoted] = useState("");
  const [results, setResults] = useState("");
  const [error, setError] = useState("");
  const [selectedVote, setSelectedVote] = useState(""); // State to track selected vote option

  const signMessage = async () => {
    const signer = getOfflineSignerAmino();
    try {
      if (!address) {
        setError("Please connect wallet first");
        return;
      }

      const signDoc = {
        chain_id: chainConfig.chain_id,
        account_number: "uwupunks.com",
        sequence: "0",
        fee: {
          amount: [{ amount: "0", denom: "UWU" }],
          gas: "0",
        },
        msgs: [
          {
            type: "cosmos-sdk/MsgText",
            value: {
              message: "Check Balances",
              signer: address,
            },
          },
        ],
        memo: "",
      };

      const result = await signer.signAmino(address, signDoc, {
        preferNoSetFee: true,
      });

      setError("");

      // Verify on server
      const response = await fetch("https://vote-api.uwupunks.com/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signed: result.signed, // The signed document
          signature: result.signature, // The signature object
        }),
      });
      const res = await response.json();
      setBalances(res);
    } catch (err) {
      setError("Failed to sign message: " + err.message);
    }
  };
  const vote = async () => {
    const signer = getOfflineSignerAmino();
    try {
      if (!address) {
        setError("Please connect wallet first");
        return;
      }
      if (!selectedVote) {
        setError("select a vote option");
        return;
      }

      const signDoc = {
        chain_id: chainConfig.chain_id,
        account_number: "uwupunks.com",
        sequence: "0",
        fee: {
          amount: [{ amount: "0", denom: "UWU" }],
          gas: "0",
        },
        msgs: [
          {
            type: "cosmos-sdk/MsgText",
            value: {
              message: "vote=" + selectedVote,
              signer: address,
            },
          },
        ],
        memo: "",
      };

      const result = await signer.signAmino(address, signDoc, {
        preferNoSetFee: true,
      });

      setError("");

      // Verify on server
      const response = await fetch("https://vote-api.uwupunks.com/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signed: result.signed, // The signed document
          signature: result.signature, // The signature object
        }),
      });
      const res = await response.json();
      setVoted(res);
    } catch (err) {
      setError("Failed to vote: " + err.message);
    }
  };
  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Vote For UWU</h1>
      <div className="uni-head"></div>
      <div className="balances-container">
        <p>
          The native chain has been down for over a month. The time has come to
          decide the fate of UWU.
        </p>
        <p>
          A snapshot was taken on block 11909000 by @unitylchaos_ This snapshot
          will be used to restore the unicorn-420 chain including all balances,
          LPs, and staked UWU.
        </p>
        <p>
          This snapshot will be used to determine your voting power. Please sign
          the message to prove you own the address and cast your vote. Voting
          ends April 12 10PM UTC. You can also verify your UWU and memoji
          holdings.
        </p>
        <p>
          {error && (
            <div style={{ color: "red", marginTop: "20px" }}>{error}</div>
          )}
        </p>
      </div>
      {!address ? (
        <button onClick={connect}>Connect Wallet (Keplr/Leap)</button>
      ) : (
        <div>
          <div className="balances-container">
            <p>Connected Address: {address}</p>
            <p>Wallet: {wallet?.prettyName}</p>
            <button
              onClick={() => {
                setBalances("");
                disconnect();
              }}
            >
              Disconnect
            </button>

            {!balances && (
              <p>
                <button onClick={signMessage}>Sign To Vote</button>
                <button
                  onClick={async () => {
                    setBalances("");
                    const response = await fetch(
                      "https://vote-api.uwupunks.com/results",
                      {
                        method: "GET",
                      }
                    );
                    const res = await response.json();
                    const summarizedResults = calcVotes(res);
                    setResults(summarizedResults);
                  }}
                >
                  See Results
                </button>
              </p>
            )}
          </div>
          {voted !== "" && (
            <div className="balances-container">
              {voted?.verified && (
                <div style={{ color: "green", marginTop: "20px" }}>
                  {voted.message}
                </div>
              )}
              {voted?.verified === false && (
                <div style={{ color: "red", marginTop: "20px" }}>
                  {voted.message}
                </div>
              )}
            </div>
          )}
          {balances && !voted && (
            <div className="balances-container">
              <p>
                Please vote on which chain you would like to migrate to. The
                options are:
              </p>

              <div style={{ textAlign: "left" }}>
                <label>
                  <input
                    type="radio"
                    name="vote"
                    value="1"
                    checked={selectedVote === "1"}
                    onChange={(e) => setSelectedVote(e.target.value)}
                  />
                  Migrate to Osmosis
                </label>
                <br />
                <label>
                  <input
                    type="radio"
                    name="vote"
                    value="2"
                    checked={selectedVote === "2"}
                    onChange={(e) => setSelectedVote(e.target.value)}
                  />
                  Sovereign Chain (run our own validators on Cosmos SDK)
                </label>
                <br />
                <label>
                  <input
                    type="radio"
                    name="vote"
                    value="3"
                    checked={selectedVote === "3"}
                    onChange={(e) => setSelectedVote(e.target.value)}
                  />
                  Migrate to Ethereum (mainnet, L2, or L3)
                </label>
                <br />
                <label>
                  <input
                    type="radio"
                    name="vote"
                    value="4"
                    checked={selectedVote === "4"}
                    onChange={(e) => setSelectedVote(e.target.value)}
                  />
                  Do Nothing
                </label>
                <br />
                <label>
                  <input
                    type="radio"
                    name="vote"
                    value="5"
                    checked={selectedVote === "5"}
                    onChange={(e) => setSelectedVote(e.target.value)}
                  />
                  Abstain
                </label>
              </div>
              <p>
                <button onClick={vote}>Vote</button>
              </p>
            </div>
          )}
          {results && (
            <div className="balances-container">
              <h2 className="section-title">Current Votes</h2>
              <p style={{ textAlign: "left" }}>
                {Object.entries(results.voteSummary).map(
                  ([vote, percentage]) => (
                    <div key={vote}>
                      Vote {vote}: {percentage?.toFixed(1)}%
                    </div>
                  )
                )}
                <strong>Total UWU:</strong>{" "}
                {(results.totalUwu / Math.pow(10, 6))?.toLocaleString()}
              </p>
              <h2 className="section-title">Result Details</h2>
              {results.results.map((result, index) =>
                renderObject(result, index, true)
              )}
            </div>
          )}
          {balances && (
            <div className="balances-container">
              <h2 className="section-title">Balances</h2>
              {balances?.balances?.map((balance, index) =>
                renderObject(balance, index)
              )}

              <h2 className="section-title">Kaway Bond</h2>
              {balances.kaway_bond?.map((bond, index) =>
                renderObject(bond, index)
              )}

              <h2 className="section-title">LP</h2>
              {balances.lp?.map((lp, index) => renderObject(lp, index))}

              <h2 className="section-title">UWUval Bond</h2>
              {balances.uwuval_bond?.length > 0 ? (
                balances.uwuval_bond.map((bond, index) =>
                  renderObject(bond, index)
                )
              ) : (
                <p className="no-data">No data available</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ChainProvider
      logLevel="DEBUG"
      chains={[chainConfig]}
      assetLists={[chainConfig.assetList]}
      wallets={[...keplrWallets, ...leapWallets]}
      walletConnectOptions={{
        signClient: {
          projectId: "2ed53ccc1576655385fb790c191f619e",
        },
      }}
      signerOptions={{
        preferredSignType: () => {
          return "direct";
        },
      }}
      modalOptions={{
        walletModal: {
          theme: "dark",
        },
      }}
    >
      <WalletConnectedApp chainName="unicorn" />
    </ChainProvider>
  );
}

export default App;
