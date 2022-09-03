import React, { useState, useEffect, useCallback } from 'react';
import { useMetaMask } from 'metamask-react';
import BarLoader from 'react-spinners/BarLoader';
import { XChainStakingSDK } from './sdk';
import { PoolType, NETWORKS, ADMIN_MODE } from './sdk/constants';
import Pool from './components/pool';
import Stake from './components/stake';
import cg from './assets/cg.png'
import './App.css';

function App() {
  const { status, connect, account, chainId, ethereum, switchChain } = useMetaMask();
  const [poolName, setPoolName] = useState<string>('');
  const [networkId, setNetworkId] = useState<string>(NETWORKS[0].chainId);
  const [poolStakeTokenAddress, setPoolStakeTokenAddress] = useState<string>('');
  const [poolHarvestTokenAddress, setPoolHarvestTokenAddress] = useState<string>('');
  const [poolApr, setPoolApr] = useState<string | number>(0);
  const [poolDuration, setPoolDuration] = useState<string | number>(0);
  const [pools, setPools] = useState<PoolType[]>([]);
  const [isStakeOpen, setStakeOpen] = useState<boolean>(false);
  const [isCreatePoolOpen, setCreatePoolOpen] = useState<boolean>(false);
  const [selectedPool, setSelectedPool] = useState<PoolType | null>(null);
  const [isWaitingTransaction, setWaitingTransaction] = useState<boolean>(false);
  const fetchPools = useCallback(() => {
    const allPromise: any = [];

    NETWORKS.forEach((network) => {
      const localSDK = new XChainStakingSDK(network.rpcUrl, network.contractAddress);
      allPromise.push(localSDK.getContractPools(network.chainId));
    });
    Promise.all(allPromise)
      .then((result) => {
        const mergedResult = [].concat.apply([], result);
        setPools(mergedResult);
      })
      .catch((e: any) => {
        console.log('fetchPools err ', e);
      });
  }, []);

  const handleCreate = async () => {
    setWaitingTransaction(true);

    const selectedNetwork = NETWORKS.find((el) => el.chainId === networkId);

    if (selectedNetwork) {
      const localSDK = new XChainStakingSDK(selectedNetwork.rpcUrl, selectedNetwork.contractAddress);

      const currentChainId = await localSDK.getChainId();
      if (status !== 'connected') {
        await connect();
      }
      if (currentChainId !== selectedNetwork.chainId) {
        await switchChain(selectedNetwork.chainId);
      }
      localSDK
        .createNewPool(poolStakeTokenAddress, poolHarvestTokenAddress, poolName, Number(poolApr), Number(poolDuration))
        .then(() => {
          setCreatePoolOpen(false);
          fetchPools();
          setWaitingTransaction(false);
        })
        .catch((e) => {
          console.error('createNewPool err', e);
          setWaitingTransaction(false);
        });
    }
  };

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  return (
    <div style={{ margin: '50px' }}>
      <img alt='logo' src={cg} style={{width: '300px'}}></img>
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {status === 'initializing' && <div>Synchronisation with MetaMask ongoing...</div>}
          {status === 'unavailable' && <div>MetaMask not available</div>}
          {status === 'connecting' && <div>Connecting...</div>}
          {status === 'connected' && ethereum && ADMIN_MODE && (
            <div style={{ textAlign: 'right' }}>
              <h3>
                Wallet address: {account?.slice(0, 5)}...{account?.slice(38, 42)}
              </h3>
              <h4>Chain ID: {chainId}</h4>
            </div>
          )}
          {status === 'notConnected' && (
            <div style={{ color: 'red' }}>
              <h3>Wallet not connected</h3>
            </div>
          )}
          <button
            onClick={async () => {
              connect();
            }}
          >
            {status === 'connected' ? `Wallet address: ${account?.slice(0, 5)}...${account?.slice(38, 42)}` : 'CONNECT WALLET'}
          </button>
        </div>
        <hr />
        {ADMIN_MODE && <button onClick={() => setCreatePoolOpen(true)}>CREATE NEW POOL</button>}
        {pools.map((pool, index) => (
          <Pool
            pool={pool}
            key={index}
            setSelectedPool={setSelectedPool}
            setStakeOpen={setStakeOpen}
            walletAddress={account}
            connect={connect}
            switchChain={switchChain}
            walletStatus={status}
          ></Pool>
        ))}
        {isCreatePoolOpen && (
          <div
          className='newPool'
            style={{
              position: 'absolute',
              top: '10%',
              left: '30%',
              border: '2px solid #EF4423',
              borderRadius: '10px',
              background: 'white',
              padding: '20px',
              fontWeight: 'bold',
            }}
          >
            <p>Select network:</p>
            <select
              value={networkId}
              onChange={(e) => {
                setNetworkId(e.target.value);
              }}
            >
              {NETWORKS.map((network, index) => (
                <option key={index}>{network.chainId}</option>
              ))}
            </select>
            <p>Pool name:</p>
            <input
              onChange={(e) => {
                setPoolName(e.target.value);
              }}
              value={poolName}
            ></input>
            <p>Stake Token address:</p>
            <input
              onChange={(e) => {
                setPoolStakeTokenAddress(e.target.value);
              }}
              value={poolStakeTokenAddress}
            ></input>

            <p>Harvest Token address:</p>
            <input
              onChange={(e) => {
                setPoolHarvestTokenAddress(e.target.value);
              }}
              value={poolHarvestTokenAddress}
            ></input>

            <p>Pool APR:</p>
            <input
              onChange={(e) => {
                setPoolApr(e.target.value);
              }}
              value={poolApr}
            ></input>

            <p>Pool duration:</p>
            <input
              onChange={(e) => {
                setPoolDuration(e.target.value);
              }}
              value={poolDuration}
            ></input>
            <hr />
            <button onClick={handleCreate}>CREATE</button>
            <button onClick={() => setCreatePoolOpen(false)}>CLOSE</button>
            {isWaitingTransaction && (
              <>
                <hr />
                <h3>Wait for transaction...</h3>
                <BarLoader height={15} width={400} color={'#420CF2'} />
              </>
            )}
          </div>
        )}
        {isStakeOpen && selectedPool && account && (
          <>
            <Stake
              selectedPool={selectedPool}
              setSelectedPool={setSelectedPool}
              setStakeOpen={setStakeOpen}
              walletAddress={account}
              fetchPools={fetchPools}
            ></Stake>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
