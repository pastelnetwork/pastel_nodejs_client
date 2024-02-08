# Pastel Node.js Client

The Pastel Node.js Client is a comprehensive library designed to facilitate interactions with the Pastel blockchain from Node.js applications. This library simplifies tasks such as querying blockchain data, managing Pastel IDs, and performing utility operations related to Pastel and networking.

![Illustration](https://raw.githubusercontent.com/pastelnetwork/pastel_nodejs_client/master/illustration.webp)

## Features

### Blockchain Operations

- **Block Information**: Fetch current block height and hash, previous block hash and Merkle root, and last block data.
- **Address and Transaction**: Check PSL address balance and retrieve raw transaction data by transaction ID.
- **Message Verification**: Verify messages using PastelID, ensuring authenticity and integrity.
- **Masternode and Supernode**: List masternode top information and check supernode list, providing insights into network participants.

### Utility Functions

- **PastelID Management**: Generate PastelIDs, validate addresses, and manage PastelID files.
- **Networking**: Validate IP addresses and retrieve external IP, aiding in network-related operations.
- **Pasteld Management**: Check Pasteld status and relaunch if necessary, ensuring the Pastel daemon is running correctly. Install and configure Pasteld, facilitating setup and configuration.

## Installation

```bash
npm install pastel_nodejs_client
# or
yarn add pastel_nodejs_client
```

## Usage

### Initializing the Client

```javascript
import { PastelBlockchainOperations } from 'pastel_nodejs_client';

const blockchainOps = new PastelBlockchainOperations();
await blockchainOps.initialize();
```

### Performing Blockchain Operations

```javascript
// Fetch current block height and hash
const currentBlockInfo = await blockchainOps.getCurrentPastelBlockHeightAndHash();
console.log(currentBlockInfo);

// Verify a message with PastelID
const verificationResult = await blockchainOps.verifyMessageWithPastelid(pastelid, message, signature);
console.log(`Verification Result: ${verificationResult}`);
```

These functions are examples of higher-level operations that leverage the Pastel blockchain's features. They abstract the complexity of direct blockchain interactions into more accessible and purpose-driven functionalities. Let's delve into what each one does and how they work at a high level:

### `checkSupernodeListFunc()`
This function gathers comprehensive data about the Pastel supernodes registered on the network. Supernodes are crucial for the Pastel network, performing tasks such as facilitating transactions, supporting the network's security, and more. The function makes multiple RPC calls to fetch different aspects of supernode information, including status, rankings, and additional data points not directly available through a single call. It processes and structures this data into a more readable and informative format, providing insights into the operational status and performance of each supernode. The amalgamation of data from different calls enables developers and network administrators to have a holistic view of the supernode ecosystem within Pastel.

### `getPastelBlockchainTicketFunc(txid)`
This function is designed to retrieve and interpret blockchain tickets associated with a given transaction ID (`txid`). Tickets in the Pastel network serve various purposes, such as representing assets, ownership, and other forms of metadata. By fetching a ticket, the function not only retrieves the raw data but also enriches it with contextual information, such as comparing the ticket's registration block height against the current blockchain height and fetching activation tickets if applicable. This process allows for a deeper understanding of the ticket's status, its role within the network, and its lifecycle, providing valuable insights for users and developers interacting with Pastel's unique ticketing system.

### `getAllPastelBlockchainTicketsFunc(verbose)`
This function performs a broad sweep of the Pastel blockchain to collect tickets of all types. The Pastel network utilizes a ticketing system for various functions, including NFT registration, ownership transfers, and user identities. By iterating over predefined ticket types, the function systematically fetches lists of tickets from the blockchain. The optional `verbose` parameter allows for detailed logging of the process, which can be useful for debugging or informational purposes. This comprehensive approach offers a macroscopic view of the network's activity, enabling analysis, monitoring, and aggregation of data across different ticket categories.

### `getUsernamesFromPastelIdFunc(pastelId)`
This function retrieves all usernames associated with a given PastelID. By calling the "tickets list username" RPC method, it filters through all username tickets to find those that match the specified PastelID. This is particularly useful for identifying all user aliases linked to a single PastelID, enhancing user experience and interaction within the Pastel ecosystem. If no usernames are found for the given PastelID, it returns an error message, thus also serving as a validation check for PastelID-user associations.

### `getPastelIdFromUsernameFunc(username)`
The opposite of `getUsernamesFromPastelIdFunc`, this function finds the PastelID associated with a given username. It searches through the username tickets listed on the blockchain to find a matching username and returns the associated PastelID. This is useful for authentication and user lookup purposes, allowing for a human-readable identifier to be resolved back to a cryptographic identifier used within the network.

### `testnetPastelIdFileDispenserFunc(password, verbose)`
This function generates a new PastelID and optionally retrieves the associated file data. By invoking the "pastelid newkey" RPC method with a provided password, it creates a new PastelID and then attempts to read the corresponding file from the local filesystem where Pastel keys are stored. This function is instrumental for onboarding new users or nodes onto the testnet by generating the necessary cryptographic identities. It includes verbose logging for detailed operational insight and returns both the PastelID and its key file data encoded in base64, facilitating easy distribution or storage.

### `getAllRegistrationTicketTxidsCorrespondingToACollectionTicketTxidFunc(collectionTicketTxid)`
Focused on the Pastel collection tickets, this function aims to retrieve all registration ticket transaction IDs that are linked to a given collection ticket's transaction ID. Initially, it fetches the collection ticket to determine its type and, if applicable, its activation ticket information. Based on the ticket type and the linked activation ticket, it searches for corresponding registration tickets that are part of the collection. This operation is crucial for aggregating all parts of a collection, which can consist of various assets like NFTs or other items, under a single collection ticket. It navigates through different ticket types and their interconnections, showcasing the depth of Pastel's ticketing system for asset management and organization.

Internally, these functions abstract away the complexity of direct blockchain interactions, providing a more user-friendly interface for developers to engage with Pastel's rich feature set. They handle error management, data transformation, and procedural logic, allowing for efficient and effective utilization of Pastel's blockchain capabilities.

There are also many dozens of other functions that are directly calling corresponding RPC methods exposed by pasteld, but without any additional logic or transformation. These functions are designed to provide a direct interface to the Pastel blockchain, allowing developers to interact with the blockchain at a low level, if necessary. A complete list of these functions can be found in the "Detailed Listing of Functions" section below.

### Using Utility Functions

The Pastel Node.js client provides a set of utility functions designed to assist with common tasks related to the Pastel blockchain and its ecosystem. These functions facilitate operations such as timing execution, validating IP addresses, checking Pastel daemon status, and more.

```javascript
import {
  getExternalIp,
  checkIfPasteldIsRunningCorrectlyAndRelaunchIfRequired,
  installPasteld
} from 'pastel_nodejs_client';

// Getting external IP address
const externalIp = await getExternalIp();
console.log(`External IP: ${externalIp}`);

// Checking if Pasteld is running correctly and attempting a restart if necessary
const isPasteldRunning = await checkIfPasteldIsRunningCorrectlyAndRelaunchIfRequired();
console.log(`Is Pasteld running correctly: ${isPasteldRunning ? 'Yes' : 'No'}`);

// Installing Pasteld
await installPasteld();
```

These utility functions are designed to integrate seamlessly with Pastel network operations, enhancing the efficiency and reliability of applications built on top of Pastel. Whether it's managing time-sensitive operations, ensuring network connectivity, or maintaining the Pastel daemon, these utilities provide a robust foundation for developers working within the Pastel ecosystem.

The `installPasteld` function is designed to automate the installation of the Pastel daemon (`pasteld`) on a system, specifically targeting a Unix-like environment. It operates in several steps, leveraging shell commands executed from Node.js. Here's a breakdown of how it works internally:

1. **Determine Installation Status**: The function first checks if `pasteld` is already installed by trying to detect the presence of the `pastelup` directory in the user's home directory. This is done using the `execSync` function with a shell command (`test -d ~/pastelup/pastelup`) to test if the directory exists. If the command returns without error, it implies that `pastelup` is already installed.

2. **Download and Install `pastelup`**: If `pastelup` is not detected, the function executes a series of commands to download and set up `pastelup`, a utility designed to install and manage Pastel software components. The installation involves:
   - Creating a directory for `pastelup` (`mkdir ~/pastelup`).
   - Navigating to this directory and downloading the `pastelup` executable from Pastel's GitHub releases page.
   - Renaming the downloaded file to `pastelup` and changing its permissions to make it executable (`chmod 755 pastelup`).

3. **Execute `pastelup` Command**: Whether `pastelup` was just installed or already present, the function then constructs a command string to run `pastelup` with options to install `walletnode` (a component of the Pastel software suite). The command specifies the network name (e.g., `testnet`), forces the installation (`--force`), requests the latest release (`-r=latest`), and may include additional options such as specific peer addresses to connect to.

4. **Configuration Adjustments**: After running the `pastelup` installation command, the function further modifies configuration files (e.g., `walletnode.yml` and `pastel.conf`) to adjust settings such as the hostname, binding RPC server to all network interfaces (`0.0.0.0`), setting up RPC credentials, and allowing certain IP addresses for RPC connections. These modifications ensure that the `walletnode` and `pasteld` are correctly configured to communicate over the network and are accessible as needed.

5. **Error Handling**: Throughout the process, the function employs try-catch blocks to handle any errors that may occur during the execution of shell commands. If an error is encountered, it logs the error message using a `logger` utility.

6. **Logging**: The function uses logging at various stages to provide feedback about the process, including whether `pastelup` was already installed, the outcome of the installation command, and any errors encountered.


## Contributing

Contributions are welcome! Feel free to submit pull requests, open issues, or suggest new features or improvements.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).


## Detailed Listing of Functions

- `getAddressMempool(addresses)`: Retrieves the current mempool transactions related to the specified addresses. Returns an array of transactions in the mempool that involve the given addresses.

- `getTotalCoinSupply()`: Returns the total supply of coins in the network. This method provides the aggregate number of coins that have been mined.

- `getBestBlockHash()`: Fetches the hash of the best (most recent) block in the blockchain. This can be used to get the latest block in the chain.

- `getBlock(hashOrHeight, verbosity)`: Retrieves detailed information about a block identified by its hash or height. The `verbosity` parameter determines the level of detail returned about the block.

- `getBlockchainInfo()`: Provides comprehensive information about the current state of the blockchain, including the number of blocks, the current difficulty, and other relevant data.

- `getBlockCount()`: Returns the total number of blocks in the blockchain up to the current moment.

- `getBlockDeltas(blockhash)`: Fetches detailed information about all transactions within a specific block identified by its hash, including their respective differences (deltas).

- `getBlockHash(index)`: Retrieves the hash of a block at a specific height (`index`) in the blockchain.

- `getBlockHeader(hash, verbose)`: Provides information about a block header identified by its hash. The `verbose` parameter toggles between a JSON object and a hex-encoded string.

- `getChainTips()`: Returns information about all known tips of the blockchain, including branches and the main chain.

- `getDifficulty()`: Provides the current difficulty target as a multiple of the minimum difficulty (the difficulty of the first block).

- `getMempoolInfo()`: Offers detailed information about the state of the mempool, including size, transactions count, and memory usage.

- `getRawMempool(verbose)`: Retrieves all transaction identifiers in the mempool as a list. If `verbose` is true, returns detailed information about each transaction.

- `getTxOut(txid, n, includemempool)`: Provides details about an unspent transaction output (UTXO), including its value and script. The `includemempool` flag specifies whether to include the mempool.

- `getTxOutProof(txids, blockhash)`: Generates a proof of inclusion for one or more transactions (`txids`), proving they are included in a block. `blockhash` is optional and specifies the block to check.

- `getTxOutSetInfo()`: Offers detailed statistics about the UTXO set, including the total number of UTXOs and the disk size it occupies.

- `verifyChain(checklevel, numblocks)`: Verifies the blockchain data for the last `numblocks` blocks at a `checklevel` of thoroughness. Returns a boolean indicating the verification result.

- `verifyTxOutProof(proof)`: Verifies a proof of inclusion for a transaction in a block and returns the transaction IDs it proves.

- `getInfo()`: Retrieves general information about the server and blockchain network, including version, protocol version, wallet version, and balance.

- `getMemoryInfo()`: Returns detailed information about memory usage related to the blockchain and server.

- `help(command)`: Provides a list of all available RPC commands when called without parameters, or detailed help for a specific command if a command name is provided.

- `stop()`: Safely shuts down the server. This method will return a message indicating that the shutdown process has started.

- `generate(numblocks, pastelID)`: Mines a specified number of blocks. Optionally, a PastelID can be provided to associate with the generated blocks. This is typically used in test environments.

- `getGenerate()`: Returns the current mining status of the node, indicating whether the node is currently generating blocks.

- `refreshMiningMnIdInfo()`: Refreshes mining-related information for a masternode identifier. This can be used to update the node's mining configuration or status.

- `setGenerate(generate, genproclimit)`: Enables or disables block generation (mining) on the node, with an optional parameter to limit the number of processors to use.

- `getBlockSubsidy(height)`: Returns the subsidy reward for the next block to be mined. If a height is specified, it returns the subsidy for a block at that height.

- `getBlockTemplate(jsonrequestobject)`: Provides a template for building a new block, allowing miners to construct a block for mining. The `jsonrequestobject` can specify certain parameters for the block template.

- `getLocalSolps()`: Returns the number of solutions (sol/s) per second the local node is generating while mining.

- `getMiningEligibility(mnfilter)`: Determines the eligibility of a masternode for mining, based on an optional filter criteria.

- `getMiningInfo()`: Provides detailed information about the mining status of the node, including the current mining difficulty, and network hashrate.

- `getNetworkHashPs(blocks, height)`: Returns the estimated network hashes per second based on the last `blocks`, up to a specified `height`.

- `getNetworkSolps(blocks, height)`: Provides the estimated solutions per second over the network, calculated over the last `blocks` up to a given `height`.

- `getNextBlockSubsidy()`: Retrieves the subsidy amount for the next block to be mined, providing insight into the mining reward.

- `prioritiseTransaction(txid, priorityDelta, feeDelta)`: Temporarily increases the priority of a transaction in the mempool, making it more likely to be included in a block. This is done by modifying its effective priority and fee.

- `submitBlock(hexdata, jsonparametersobject)`: Submits a new block to the network. The block is specified in hex format, with optional JSON parameters to modify how the block is processed.

- `masternodeCount(mode)`: Counts the number of masternodes based on the specified mode. Modes include 'ps', 'enabled', 'all', 'current', and 'qualify', each filtering the count by different criteria.

- `masternodeCurrent()`: Retrieves information about the masternode that is currently expected to receive the next reward.

- `masternodeGenkey()`: Generates a new masternode private key, used for operating a masternode.

- `masternodeOutputs()`: Lists the unspent transaction outputs (UTXOs) that are eligible for masternode collateral. Useful for setting up a masternode.

- `masternodeStartAlias(alias)`: Starts the masternode associated with the specified alias.

- `masternodeStart(mode)`: Initiates masternodes based on the mode specified. Modes are 'all', 'missing', and 'disabled', targeting different subsets of masternodes for startup.

- `masternodeStatus()`: Provides the current status of the masternode running on the node.

- `masternodeList(mode, filter)`: Lists masternodes filtered by the given mode and optional filter. Modes can include 'addr', 'rank', 'status', and others to specify the type of information returned.

- `masternodeListConf()`: Returns the list of masternodes as configured in the masternode.conf file on the node.

- `masternodeWinner()`: Identifies the masternode that is next in line to receive a reward.

- `masternodeWinners(count, blockHash)`: Lists the masternodes that have won rewards, optionally filtered by count and blockHash.

- `masternodeTop(n, x)`: Retrieves the top masternodes for the nth block. The parameter 'x' controls whether to return masternodes based on the current list and hash of the nth block.

- `masternodeBroadcastCreateAlias(alias)`: Creates and broadcasts a masternode announcement message for the masternode with the specified alias.

- `masternodeBroadcastCreateAll()`: Creates and broadcasts masternode announcement messages for all masternodes configured on the node.

- `masternodeBroadcastDecode(message)`: Decodes a masternode broadcast message, providing detailed information about the masternode it pertains to.

- `masternodeBroadcastRelay(message)`: Relays a masternode broadcast message to the network, helping to propagate the announcement.

- `masternodelistActiveseconds(filter)`: Lists masternodes along with the number of seconds they have been active, optionally filtered by the provided criteria.

- `masternodelistAddr(filter)`: Lists masternodes along with their associated addresses, optionally filtered by the provided criteria.

- `masternodelistFull(filter)`: Provides a full listing of masternodes, optionally filtered by the provided criteria, including detailed information about each masternode.

- `masternodelistInfo(filter)`: Lists detailed information about masternodes, optionally filtered by the provided criteria.

- `masternodelistLastPaidBlock(filter)`: Lists masternodes along with the last block they were paid a reward, optionally filtered by the provided criteria.

- `masternodelistLastPaidTime(filter)`: Lists masternodes along with the last time they were paid a reward, optionally filtered by the provided criteria.

- `masternodelistLastSeen(filter)`: Lists masternodes along with the last time they were seen, optionally filtered by the provided criteria.

- `masternodelistPayee(filter)`: Lists masternodes along with their payee information, optionally filtered by the provided criteria.

- `masternodelistProtocol(filter)`: Lists masternodes along with their protocol version, optionally filtered by the provided criteria.

- `masternodelistPubkey(filter)`: Lists masternodes along with their public keys, optionally filtered by the provided criteria.

- `masternodelistRank(filter)`: Ranks masternodes according to their score, optionally filtered by the provided criteria.

- `masternodelistStatus(filter)`: Lists the status of masternodes, optionally filtered by the provided criteria.

- `masternodelistExtra(filter)`: Provides additional, possibly custom, information about masternodes, optionally filtered by the provided criteria.

- `chaindataCommand(command, ...args)`: Executes a specified command related to blockchain data operations, passing any additional arguments required for the command.

- `generateReport(reportName, ...args)`: Generates a specified report by name, utilizing any additional arguments passed for the report's generation process.

- `getFeeSchedule()`: Retrieves the current fee schedule from the network, detailing the costs associated with various network operations.

- `ingestCommand(command, ...args)`: Executes a specified ingestion command, such as processing and integrating external data into the network, with additional arguments for command specifics.

- `masternodeCommand(command, ...args)`: Carries out a specified command related to masternode operations, such as masternode count, starting, or status checks, with additional parameters as needed.

- `masternodeBroadcastCommand(command, ...args)`: Executes commands for broadcasting masternode information, like creating or relaying masternode broadcast messages, with additional arguments for the command.

- `mnsyncCommand(command = "status")`: Manages masternode synchronization processes, such as checking status, advancing to the next synchronization stage, or resetting, with a default command of checking the status.

- `pastelidCommand(command, ...args)`: Executes commands related to PastelID, a unique identifier within the network, with additional arguments for specific operations like creation, verification, etc.

- `storagefeeCommand(command, ...args)`: Executes commands related to the storage fee system, adjusting or querying fee parameters and settings with additional arguments.

- `ticketsCommand(command, ...args)`: Manages ticket system commands for the network, enabling operations like creation, listing, and validation of various types of tickets with additional arguments.

- `addNode(node, command)`: Manages peer nodes by adding, removing, or attempting a connection based on the specified command ('add', 'remove', 'onetry') to the node address provided.

- `clearBanned()`: Clears all currently banned IP addresses, resetting the list of banned nodes.

- `disconnectNode(node)`: Disconnects a specific node identified by its address or node ID from the network.

- `getAddedNodeInfo(dns, node = "")`: Retrieves information about nodes added using the `addnode` command, optionally filtered by a specific node address.

- `getConnectionCount()`: Returns the number of connections to other nodes on the network, indicating the node's level of network integration.

- `getDeprecationInfo()`: Provides information regarding the node's software deprecation status, including scheduled deprecation dates and versions.

- `getNetTotals()`: Retrieves total network traffic statistics, including total bytes sent and received.

- `getNetworkInfo()`: Offers detailed information about the node's view of the network, including protocol version, connection info, and active network services.

- `getPeerInfo()`: Provides detailed information about each connected peer, including IP addresses, connection durations, and activity metrics.

- `listBanned()`: Returns a list of all IP addresses currently banned from connecting to the node.

- `ping()`: Sends a ping command to all connected peers to measure network latency and peer responsiveness.

- `setBan(ip, command, bantime, absolute)`: Manages the ban list by adding or removing an IP address with optional parameters for ban duration and whether the ban should be treated as absolute time.

- `createRawTransaction(transactions, addresses, locktime, expiryheight)`: Constructs a raw transaction with specified inputs and outputs. `transactions` is an array detailing the inputs, while `addresses` maps recipient addresses to amounts. Optional `locktime` and `expiryheight` parameters allow setting transaction's locktime and expiry.

- `getRawTransaction(txid, verbose, blockhash)`: Fetches a raw transaction by its ID (`txid`). If `verbose` is set to 1, the transaction is returned as a JSON object; otherwise, it's returned as a hex-encoded string. The `blockhash` parameter can specify the block in which to search for the transaction.

- `sendRawTransaction(hexstring, allowhighfees)`: Submits a raw transaction (encoded as a hex string) to the network. The `allowhighfees` flag indicates whether to allow the transaction to pay high fees.

- `signRawTransaction(hexstring, prevtxs, privatekeys, sighashtype, branchid)`: Signs a raw transaction (`hexstring`) with the specified private keys. `prevtxs` is an array of previous transaction outputs that this transaction depends on. `sighashtype` specifies the signature hash type, with "ALL" being the default. `branchid` is an optional parameter to specify the consensus branch ID for the signature.

- `decodeRawTransaction(hexstring)`: Accepts a hex-encoded transaction string and decodes it to a JSON object describing the transaction.
  
- `decodeScript(hexstring)`: Accepts a hex-encoded script and decodes it to a JSON object describing the script, along with other details like addresses, if applicable.
  
- `fundRawTransaction(hexstring, options)`: Accepts a hex-encoded transaction string and an optional `options` object to fund the transaction with inputs, change addresses, and other settings. This method returns the funded transaction in hex format, along with details like the fee added.
  
- `createMultisig(nrequired, keys)`: Creates a multi-signature address with `nrequired` of the provided keys required to sign transactions.

- `estimateFee(nblocks)`: Provides an estimate of the transaction fee per kilobyte required for a transaction to be included within `nblocks` number of blocks.

- `estimatePriority(nblocks)`: Provides a priority estimate for a transaction to be included within `nblocks` number of blocks.

- `validateAddress(address)`: Validates a given t-address and provides information about it, such as whether it is valid and if it is a script.

- `verifyMessage(address, signature, message)`: Verifies a signature made by the private key of a given t-address.

- `zValidateAddress(zaddr)`: Validates a given z-address and provides detailed information about it, similar to `validateAddress` but for z-addresses.

- `addMultisigAddress(nrequired, keys, account = "")`: Creates a multisig address with `nrequired` of the provided keys and associates it with an `account`.

- `backupWallet(destination)`: Backs up the wallet to the specified `destination`.

- `dumpPrivKey(tAddr)`: Dumps the private key for the specified Pastel transparent address.

- `dumpWallet(filename)`: Dumps all wallet keys into a file at the specified `filename`.

- `encryptWallet(passphrase)`: Encrypts the wallet with the given `passphrase`.

- `fixMissingTxs(startingHeight, isInvolvingMe = false)`: Attempts to fix missing transactions starting from `startingHeight`, optionally filtering for transactions involving the wallet.

- `getAccount(zcashAddress)`: Returns the account associated with the given Pastel address.

- `getAccountAddress(account)`: Returns a new address for the specified `account`.

- `getAddressesByAccount(account)`: Returns the list of addresses associated with the specified `account`.

- `getBalance(account = "", minconf = 1, includeWatchonly = false)`: Returns the balance for the specified `account`, with

 optional parameters for minimum confirmations and including watch-only addresses.

- `getNewAddress(account = "")`: Generates and returns a new Pastel address associated with the specified `account`.

- `getRawChangeAddress()`: Returns a new raw change address.

- `getReceivedByAccount(account, minconf = 1)`: Returns the total amount received by the specified `account`, with an optional minimum number of confirmations.

- `getTransaction(txid, includeWatchonly = false)`: Fetches detailed information about a specific transaction given its ID.

- `getTxFee(txid)`: Retrieves the transaction fee for a given transaction ID.

- `getUnconfirmedBalance()`: Returns the total unconfirmed balance of the wallet.

- `getWalletInfo()`: Provides various state info about the wallet.

- `importAddress(address, label = "", rescan = true)`: Imports a Pastel address.

- `importPrivKey(zcashPrivKey, label = "", rescan = true)`: Imports a private key associated with a Pastel address.

- `importWallet(filename)`: Imports a wallet from a file.

- `keypoolRefill(newSize = 100)`: Refills the key pool to ensure future addresses are pre-generated.

- `listAccounts(minconf = 1, includeWatchonly = false)`: Lists accounts and their balances.

- `listAddressAmounts(includeEmpty = false, ismineFilter = true)`: Lists addresses and their amounts, optionally including empty addresses and filtering for wallet-owned addresses.

- `listAddressGroupings()`: Lists groups of addresses that might belong to the same owner based on past transactions.

- `listLockUnspent()`: Lists transactions that are locked and therefore unspendable.
  
- `listReceivedByAccount()`: Lists amounts received by each account.

- `listReceivedByAddress()`: Lists amounts received by each address.

- `listSinceBlock()`: Lists all transactions since a specific block.

- `listTransactions()`: Lists recent transactions for an account.

- `listUnspent()`: Lists unspent transaction outputs.

- `lockUnspent()`: Locks or unlocks specified transaction outputs.

- `move()`: Moves amounts between accounts within the wallet.

- `scanForMissingTxs()`: Scans for missing transactions starting from a specific height.

- `sendFrom()`: Sends an amount from an account to a Pastel address.

- `sendMany()`: Sends amounts to multiple addresses in one transaction.

- `sendToAddress()`: Sends an amount to a single Pastel address.

- `setAccount()`: Sets the account associated with a Pastel address.

- `setTxFee()`: Sets the transaction fee per kB.

- `signMessage()`: Signs a message with the private key of an address.

- `zListUnspent(...)`: Lists unspent shielded notes, optionally filtered by addresses and confirmation range.

- `zMergeToAddress(...)`: Merges multiple UTXOs and notes into a single UTXO or note, targeting a specified address.

- `zSendMany(...)`: Sends multiple amounts to multiple addresses in one transaction from a specified address.

- `zSendManyWithChangeToSender(...)`: Similar to `zSendMany`, but returns change to the sender.

- `zShieldCoinbase(...)`: Shields transparent coinbase funds by sending them to a shielded address.

- `zViewTransaction(...)`: Provides detailed shielded information about a transaction.

