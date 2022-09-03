import { BigNumber } from 'ethers';
import React, { useEffect, useState, useMemo } from 'react';
import BarLoader from 'react-spinners/BarLoader';
import redstone from 'redstone-api';

import { XChainStakingSDK } from '../../sdk';
import { PoolType, NETWORKS, ADMIN_MODE } from '../../sdk/constants';

type Props = {
  selectedPool: PoolType;
  setSelectedPool: (pool: PoolType | null) => void;
  setStakeOpen: (boolean: boolean) => void;
  walletAddress: string;
  fetchPools: () => void;
};

const Stake: React.FC<Props> = ({ selectedPool, setSelectedPool, setStakeOpen, walletAddress, fetchPools }) => {
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [stakeTokenName, setStakeTokenName] = useState<string | null>(null);
  const [rewardTokenName, setRewardTokenName] = useState<string | null>(null);
  const [stakeTokenSymbol, setStakeTokenSymbol] = useState<string | null>(null);
  const [rewardTokenSymbol, setRewardTokenSymbol] = useState<string | null>(null);
  const [stakeTokenDecimals, setStakeTokenDecimals] = useState<number | null>(null);
  const [rewardTokenDecimals, setRewardTokenDecimals] = useState<number | null>(null);
  const [stakeTokenExchangeRate, setStakeTokenExchangeRate] = useState<number | null>(null);
  const [rewardTokenExchangeRate, setRewardTokenExchangeRate] = useState<number | null>(null);

  const [isWaitingTransaction, setWaitingTransaction] = useState<boolean>(false);
  const [youStaked, setYouStaked] = useState<BigNumber | null>(null);
  const [yourHarvest, setYourHarvest] = useState<BigNumber | null>(null);

  const poolNetwork = NETWORKS.find((el) => el.chainId === selectedPool.chainId);
  const SDK = useMemo(() => new XChainStakingSDK(poolNetwork!.rpcUrl, poolNetwork!.contractAddress), [poolNetwork]);

  useEffect(() => {
    SDK.getStakesAmount(walletAddress, selectedPool.index).then((result) => {
      setYouStaked(result);
    });

    SDK.getTokenContractBalance(selectedPool.stakeTokenAddress, walletAddress).then((result) => {
      setWalletBalance(result);
    });

    SDK.getTokenContractName(selectedPool.stakeTokenAddress).then((result) => {
      setStakeTokenName(result);
    });

    SDK.getTokenContractName(selectedPool.harvestTokenAddress).then((result) => {
      setRewardTokenName(result);
    });

    SDK.getTokenContractSymbol(selectedPool.stakeTokenAddress).then((result) => {
      setStakeTokenSymbol(result);
    });
    SDK.getTokenContractSymbol(selectedPool.harvestTokenAddress).then((result) => {
      setRewardTokenSymbol(result);
    });

    SDK.getTokenContractDecimals(selectedPool.stakeTokenAddress).then((result) => {
      setStakeTokenDecimals(result);
    });

    SDK.getTokenContractDecimals(selectedPool.harvestTokenAddress).then((result) => {
      setRewardTokenDecimals(result);
    });
  }, [selectedPool, SDK, walletAddress]);

  const handleStake = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const amount = prompt('Enter amount to stake:');

    if (amount && stakeTokenDecimals) {
      setWaitingTransaction(true);

      const value = Number(amount) * 10 ** stakeTokenDecimals;

      SDK.stake(selectedPool.stakeTokenAddress, String(BigInt(value)), selectedPool.index)
        .then((result) => {
          console.log('stake result = ', result);
          setWaitingTransaction(false);
          setStakeOpen(false);
          fetchPools();
        })
        .catch((e) => {
          console.error('handleStake err: ', e);
        });
    }
  };
  const handleWithdraw = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const amount = prompt('Enter amount to withdraw:');

    if (amount && stakeTokenDecimals) {
      setWaitingTransaction(true);

      const value = Number(amount) * 10 ** stakeTokenDecimals;

      SDK.withdraw(String(value), selectedPool.index)
        .then(() => {
          setWaitingTransaction(false);
          setStakeOpen(false);
          fetchPools();
        })
        .catch((e) => {
          console.error('handleWithdraw err: ', e);
        });
    }
  };
  const handleHarvest = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setWaitingTransaction(true);

    SDK.harvest(selectedPool.index)
      .then(() => {
        setWaitingTransaction(false);
        setStakeOpen(false);
        fetchPools();
      })
      .catch((e) => {
        console.error('handleHarvest err: ', e);
      });
  };

  const handleFund = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const amount = prompt('Enter amount to fund:');

    if (amount && rewardTokenDecimals) {
      setWaitingTransaction(true);

      const value = Number(amount) * 10 ** rewardTokenDecimals;

      SDK.fund(selectedPool.harvestTokenAddress, String(value), selectedPool.index)
        .then((result) => {
          console.log('fund result = ', result);
          setWaitingTransaction(false);
          setStakeOpen(false);
          fetchPools();
        })
        .catch((e) => {
          console.error('handleFund err: ', e);
        });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (Number(youStaked?.toString()) > 0) {
        SDK.getHarvestAmount(selectedPool.index, walletAddress)
          .then((res) => {
            setYourHarvest(res);
          })
          .catch((e: any) => {
            console.log('harvest useEffect = : ', e);
          });
      }
      if (stakeTokenSymbol && rewardTokenSymbol) {
        redstone
          .getPrice([stakeTokenSymbol, rewardTokenSymbol])
          .then((res) => {
            // console.log('res', res);
            setStakeTokenExchangeRate(res[stakeTokenSymbol].value);
            setRewardTokenExchangeRate(res[rewardTokenSymbol].value);
          })
          .catch((e) => {
            console.log('redstone err', e);
          });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [SDK, selectedPool.index, walletAddress, youStaked, stakeTokenSymbol, rewardTokenSymbol]);

  return (
    <div
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
      <p>
        Wallet address: {walletAddress.slice(0, 5)}...{walletAddress.slice(38, 42)}
      </p>
      {walletBalance && stakeTokenExchangeRate && (
        <p>
          Wallet balance: {walletBalance} {stakeTokenSymbol}{' '}
          <span className="exchangePrice">
            {(walletBalance * stakeTokenExchangeRate).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            })}
          </span>
        </p>
      )}
      <hr />
      <div style={{ display: 'flex' }}>
        <div>
          <h3>Stake token:</h3>
          <p>Name: {stakeTokenName}</p>
          <p>Symbol: {stakeTokenSymbol}</p>
          {stakeTokenExchangeRate && (
            <p>Price: {stakeTokenExchangeRate.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
          )}
        </div>
        <div>
          <h3>Reward token:</h3>
          <p>Name: {rewardTokenName}</p>
          <p>Symbol: {rewardTokenSymbol}</p>
          {rewardTokenExchangeRate && (
            <p>Price: {rewardTokenExchangeRate.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
          )}
        </div>
      </div>
      <hr />
      {stakeTokenDecimals && stakeTokenExchangeRate && (
        <p>
          Pool total shares: {Number(selectedPool.totalShares.toString()) / 10 ** stakeTokenDecimals} {stakeTokenSymbol}
          <span className="exchangePrice">
            {(
              (Number(selectedPool.totalShares.toString()) / 10 ** stakeTokenDecimals) *
              stakeTokenExchangeRate
            ).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </span>
        </p>
      )}

      <hr />
      {rewardTokenDecimals && ADMIN_MODE && rewardTokenExchangeRate && (
        <p>
          Pool total funds: {Number(selectedPool.totalFund.toString()) / 10 ** rewardTokenDecimals} {rewardTokenSymbol}
          <span className="exchangePrice">
            {(
              (Number(selectedPool.totalShares.toString()) / 10 ** rewardTokenDecimals) *
              rewardTokenExchangeRate
            ).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </span>
        </p>
      )}
      {stakeTokenDecimals && youStaked && stakeTokenExchangeRate && (
        <>
          <p>
            You staked: {Number(youStaked.toString()) / Math.pow(10, stakeTokenDecimals)} {stakeTokenSymbol}
            <span className="exchangePrice">
              {((Number(youStaked.toString()) / 10 ** stakeTokenDecimals) * stakeTokenExchangeRate).toLocaleString(
                'en-US',
                { style: 'currency', currency: 'USD' }
              )}
            </span>
          </p>
        </>
      )}
      <div style={{ display: 'flex', justifyContent: 'end' }}>
        <button onClick={handleStake}>STAKE</button>
        <button onClick={handleWithdraw}>WITHDRAW</button>
      </div>
      {rewardTokenDecimals && yourHarvest && stakeTokenDecimals && stakeTokenExchangeRate && (
        <>
          <hr />
          <p>
            Amount to harvest: {Number(yourHarvest.toString()) / Math.pow(10, rewardTokenDecimals)} {rewardTokenSymbol}
            <span className="exchangePrice">
              {((Number(yourHarvest.toString()) / 10 ** stakeTokenDecimals) * stakeTokenExchangeRate).toLocaleString(
                'en-US',
                { style: 'currency', currency: 'USD' }
              )}
            </span>
          </p>
          <div style={{ display: 'flex', justifyContent: 'end' }}>
            <button onClick={handleHarvest}>HARVEST</button>
          </div>
        </>
      )}
      <hr />
      <div style={{ display: 'flex', justifyContent: 'end' }}>
        <button
          onClick={(e) => {
            setStakeOpen(false);
            setSelectedPool(null);
          }}
        >
          CLOSE
        </button>
      </div>

      {ADMIN_MODE && (
        <>
          <hr />
          <button onClick={handleFund}>Fund</button>
          <button
            onClick={() => {
              SDK.withdrawERC(
                selectedPool.stakeTokenAddress,
                (Number(prompt('enter amount')!) * 10 ** stakeTokenDecimals!).toString()
              )
                .then((res) => {
                  console.log('withdrawERC res : ', res);
                })
                .catch((e: any) => {
                  console.log('withdrawERC error: ', e);
                });
            }}
          >
            Withdraw
          </button>
          <button
            onClick={() => {
              SDK.getTokenContractBalance(selectedPool.stakeTokenAddress, selectedPool.contractAddress)
                .then((res) => {
                  console.log('erc20 balance : ', res);
                })
                .catch((e: any) => {
                  console.log('erc20 balance error: ', e);
                });
            }}
          >
            Stake balance
          </button>
          <button
            onClick={() => {
              SDK.getTokenContractBalance(selectedPool.harvestTokenAddress, selectedPool.contractAddress)
                .then((res) => {
                  console.log('erc20 balance : ', res);
                })
                .catch((e: any) => {
                  console.log('erc20 balance error: ', e);
                });
            }}
          >
            Reward balance
          </button>
          <hr />
        </>
      )}
      {isWaitingTransaction && (
        <>
          <hr />
          <h3>Wait for transaction...</h3>
          <BarLoader height={15} width={400} color={'#420CF2'} />
        </>
      )}
    </div>
  );
};

export default Stake;
