import { ethers } from "ethers"
import { BigNumber } from "@ethersproject/bignumber";

import { ABI, PoolType, ERC20_CONTRACT_INTERFACE } from './constants'


declare global {
  interface Window {
    ethereum: ethers.providers.ExternalProvider;
  }
}

const provider = new ethers.providers.Web3Provider(window.ethereum)

export class XChainStakingSDK {
  private RPC_provider: ethers.providers.JsonRpcProvider;
  private contractAddress: string;
  /**
   * @param providerRPC_URL // provider url
   * @param contractAddress // contract address
   */
  public constructor(
    providerRPC_URL: string,
    contractAddress: string,
  ) {
    this.RPC_provider = new ethers.providers.JsonRpcProvider(providerRPC_URL)
    this.contractAddress = contractAddress
  }

  /**
   * Request to get chainId
   * uses window provider
   * @returns an integer value for the currently configured chain Id
   */
  public async getChainId(): Promise<string> {
    const result = await provider.send('eth_chainId', []);

    return result
  }

  /**
   * Request to get connected account id
   * uses window provider
   * @returns string account id
   */
  public async getAccount(): Promise<string[]> {
    const accounts = await provider.send("eth_accounts", []);

    return accounts[0];
  }

  /**
   *
   * @param tokenAddress string token address
   * @param contractAddress wallet/contract address
   * @returns number formatted with contract decimal number
   */
  public async getTokenContractBalance(
    tokenAddress: string,
    contractAddress: string,
  ): Promise<number> {
    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
    const token = new ethers.Contract(tokenAddress, ERC20_CONTRACT_INTERFACE, signer);

    const balance: BigNumber = await token.balanceOf(contractAddress);
    const decimals = await token.decimals();
    return (Number(balance.toString()) / Math.pow(10, decimals));
  }

  public async getContractPools(
    chainId: string
  ): Promise<PoolType[]> {
    const contract = new ethers.Contract(this.contractAddress, ABI, this.RPC_provider);
    const poolLength = await contract.getPoolsLength();
    let result: PoolType[] = [];
    for (let i = 0; i < Number(poolLength.toString()); i++) {
      const pool = await contract.pools(i);
      console.log('pool',pool);
      result.push({
        index: i,
        title: pool.name,
        contractAddress: this.contractAddress,
        apr: pool.apr,
        duration: pool.duration,
        chainId,
        stakeTokenAddress: pool.stakeTokenAddress,
        rewardTokenAddress: pool.rewardTokenAddress,
        totalShares: pool.totalShares,
        totalFund: pool.totalFund
      })
    }
    return result;
  }

  public async createNewPool(
    _stakeTokenAddress: string,
    _rewardTokenAddress: string,
    _name: string,
    _apr: number,
    _duration: number
  ): Promise<any> {
    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
    const contract = new ethers.Contract(this.contractAddress, ABI, signer);

    const createPoolTransaction = await contract.createPool(_stakeTokenAddress, _rewardTokenAddress, _name, _apr, _duration)
    await createPoolTransaction.wait();
  }

  public async stake(
    _tokenAddress: string,
    _amount: string,
    _poolIndex: number,
  ): Promise<any> {
    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
    const contract = new ethers.Contract(this.contractAddress, ABI, signer);

    const erc20 = new ethers.Contract(_tokenAddress, ERC20_CONTRACT_INTERFACE, signer);
    const approve = await erc20.approve(this.contractAddress, _amount);
    await approve.wait()

    const gasLimit = await contract.estimateGas.stake(_amount, _poolIndex)
    console.log('stake gasLimit', gasLimit.toString());

    const tx = await contract.stake(_amount, _poolIndex, { gasLimit })
    await tx.wait()
    return tx
  }

  public async withdraw(
    _amount: string,
    _poolIndex: number,
  ): Promise<any> {
    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
    const contract = new ethers.Contract(this.contractAddress, ABI, signer);

    const gasLimit = await contract.estimateGas.withdraw(_amount, _poolIndex,)
    console.log('withdraw gasLimit', gasLimit.toString());

    const withDrawTx = await contract.withdraw(_amount, _poolIndex, { gasLimit });
    await withDrawTx.wait();
    return withDrawTx
  }

  public async withdrawERC(
    _tokenAddress: string,
    _amount: string,
  ): Promise<any> {
    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
    const contract = new ethers.Contract(this.contractAddress, ABI, signer);

    const gasLimit = await contract.estimateGas.withdrawERC(_tokenAddress, _amount,)
    console.log('withdrawERC gasLimit', gasLimit.toString());

    const withdrawTx = await contract.withdrawERC(_tokenAddress, _amount, { gasLimit });
    await withdrawTx.wait();
    return withdrawTx
  }

  public async getHarvestAmount(
    _poolIndex: number,
    _stakerAddress: string,
  ): Promise<BigNumber> {
    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
    const contract = new ethers.Contract(this.contractAddress, ABI, signer);

    const amount = await contract.getHarvestAmount(_poolIndex, _stakerAddress)
    return amount;
  }

  public async harvest(
    _poolIndex: number,
  ): Promise<any> {
    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
    const contract = new ethers.Contract(this.contractAddress, ABI, signer);

    const gasLimit = await contract.estimateGas.harvest(_poolIndex)
    console.log('harvest gaslimit', gasLimit.toString());

    const tx = await contract.harvest(_poolIndex, { gasLimit })
    await tx.wait()
    return tx;
  }

  public async fund(
    _tokenAddress: string,
    _amount: string,
    _poolIndex: number,
  ): Promise<any> {
    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
    const contract = new ethers.Contract(this.contractAddress, ABI, signer);

    const erc20 = new ethers.Contract(_tokenAddress, ERC20_CONTRACT_INTERFACE, signer);
    const approve = await erc20.approve(this.contractAddress, _amount);
    await approve.wait()

    const gasLimit = await contract.estimateGas.fund(_amount, _poolIndex)
    console.log('fund gaslimit', gasLimit.toString());

    const tx = await contract.fund(_amount, _poolIndex, { gasLimit })
    await tx.wait();
    return tx;
  }




  public async getStakesAmount(
    _addr: string,
    _poolIndex: number,
  ): Promise<BigNumber> {
    const contract = new ethers.Contract(this.contractAddress, ABI, this.RPC_provider);
    const amount = await contract.getStakesAmount(_addr, _poolIndex)
    return amount;
  }


  /**
   *
   * @param contractAddressOrName string contract address
   * @returns string contract name
   */
  public async getTokenContractName(
    contractAddressOrName: string,
  ): Promise<string> {
    const contract = new ethers.Contract(contractAddressOrName, ERC20_CONTRACT_INTERFACE, this.RPC_provider);
    const name = await contract.name();
    return name;
  }

  /**
   *
   * @param contractAddressOrName string contract address
   * @returns string contract symbol
   */
  public async getTokenContractSymbol(
    contractAddressOrName: string
  ): Promise<string> {
    const contract = new ethers.Contract(contractAddressOrName, ERC20_CONTRACT_INTERFACE, this.RPC_provider);
    const symbol = await contract.symbol();
    return symbol;
  }

  /**
  *
  * @param contractAddressOrName string contract address
  * @returns string contract symbol
  */
  public async getTokenContractDecimals(
    contractAddressOrName: string
  ): Promise<number> {
    const contract = new ethers.Contract(contractAddressOrName, ERC20_CONTRACT_INTERFACE, this.RPC_provider);
    const decimals = await contract.decimals()
    return decimals;
  }
}
