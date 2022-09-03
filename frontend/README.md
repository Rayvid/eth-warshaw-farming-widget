# .env
Add .env file in root folder with vars:

REACT_APP_OWLRACLE_API_KEY="" // string, https://owlracle.info/bsc/gas api key to get best gas prices

REACT_APP_ADMIN_MODE="true"  // "true" / "false"(default) admin/widget mode

REACT_APP_NETWORKS='' // JSON of type Network = {
  chainId: string;
  rpcUrl: string;
  contractAddress: string;
}



# Start app
### `npm install`
### `npm start`
