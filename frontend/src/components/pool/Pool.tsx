import { BigNumber } from 'ethers';
import React, { useState, useEffect, useMemo } from 'react';
import { XChainStakingSDK } from '../../sdk';
import { PoolType, NETWORKS } from '../../sdk/constants';
import styles from './pool.module.css';


type Props = {
  pool: PoolType;
  connect: () => Promise<string[] | null>;
  switchChain: (chainId: string) => Promise<void>;
  setSelectedPool: (pool: PoolType | null) => void;
  setStakeOpen: (boolean: boolean) => void;
  walletAddress: string | undefined | null;
  walletStatus: string;
};

const PoolView: React.FC<Props> = ({
  pool,
  setSelectedPool,
  setStakeOpen,
  walletAddress,
  connect,
  switchChain,
  walletStatus,
}) => {
  const [youStaked, setYouStaked] = useState<BigNumber | null>(null);
  const [poolStakeTokenSymbol, setPoolStakeTokenSymbol] = useState<string | null>(null);
  const [poolRewardTokenSymbol, setPoolRewardTokenSymbol] = useState<string | null>(null);
  const [poolTokenDecimals, setPoolTokenDecimals] = useState<number | null>(null);

  const poolNetwork = NETWORKS.find((el) => el.chainId === pool.chainId);

  const SDK = useMemo(() => new XChainStakingSDK(poolNetwork!.rpcUrl, poolNetwork!.contractAddress), [poolNetwork]);

  useEffect(() => {
    SDK.getTokenContractSymbol(pool.stakeTokenAddress).then((symbol: string) => {
      setPoolStakeTokenSymbol(symbol);
    });
    SDK.getTokenContractSymbol(pool.rewardTokenAddress).then((symbol: string) => {
      setPoolRewardTokenSymbol(symbol);
    });
    SDK.getTokenContractDecimals(pool.stakeTokenAddress).then((decimals: number) => {
      setPoolTokenDecimals(decimals);
    });
  });

  useEffect(() => {
    if (walletAddress) {
      SDK.getStakesAmount(walletAddress, pool.index).then((result) => {
        setYouStaked(result);
      });
    }
  }, [walletAddress, pool, poolNetwork, SDK]);

  const openPoolHandler = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (walletStatus !== 'connected') {
      connect();
    }
    const currentChainId = await SDK.getChainId();
    if (currentChainId !== pool.chainId) {
      switchChain(pool.chainId).then(() => {
        setStakeOpen(true);
        setSelectedPool(pool);
      });
    } else {
      setStakeOpen(true);
      setSelectedPool(pool);
    }
  };

  return (
    <div>
      <div className={styles.pool}>
        <div className={styles.titleWrapper}>
          <span className={styles.poolTitle}>{pool.title}</span>
        </div>
        <div className={styles.walletInfoWrapper}>
          <div className={styles.walletInfo}>
            <span>Stake token</span>
            <span style={{ fontSize: '6px' }}>{pool.stakeTokenAddress}</span>
            <span style={{ fontSize: '10px' }}>{poolStakeTokenSymbol}</span>
          </div>
          <div className={styles.walletInfo}>
            <span>Reward token</span>
            <span style={{ fontSize: '6px' }}>{pool.rewardTokenAddress}</span>
            <span style={{ fontSize: '10px' }}>{poolRewardTokenSymbol}</span>
          </div>

          <div className={styles.walletInfo}>
            <span>APR</span>
            <span>{pool.apr.toString()} %</span>
          </div>
          <div className={styles.walletInfo}>
            <span>Total shares</span>
            {poolTokenDecimals && (
              <span>
                {Number(pool.totalShares.toString()) / Math.pow(10, poolTokenDecimals)} {poolStakeTokenSymbol}
              </span>
            )}
          </div>
          <div className={styles.walletInfo}>
            <span>You staked</span>
            {youStaked && poolTokenDecimals && (
              <span>
                {Number(youStaked.toString()) / Math.pow(10, poolTokenDecimals)} {poolStakeTokenSymbol}
              </span>
            )}
          </div>
          <div className={styles.duration}>
            <div className={styles.walletInfo}>
              <span>Duration</span>
              <span>{pool.duration.toString()} days</span>
            </div>
          </div>
        </div>
        <div>
          <button onClick={openPoolHandler}>OPEN</button>
        </div>
      </div>
    </div>
  );
};

export default PoolView;
