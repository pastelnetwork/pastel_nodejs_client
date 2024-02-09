import { getRpcConnection } from "./rpcConnection.js";
import logger from "./logger.js";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { fromUnixTime } from "date-fns";

export default class PastelBlockchainOperations {
  constructor() {
    this.isInitialized = false; // Initialization flag
    this.initialize();
  }

  async initialize() {
    // Logic to initialize the RPC connection and other setup tasks
    this.rpcConnection = await getRpcConnection();
    // After successful initialization
    this.isInitialized = true;
  }

  // Universal function to call any RPC method with arguments
  async callRpcMethod(method, args = []) {
    // Example wrapper function for 'getbestblockhash' using the universal function
    // async getCurrentPastelBlockHeightAndHash() {
    //   const bestBlockHash = await this.callRpcMethod("getbestblockhash");
    //   const bestBlockDetails = await this.callRpcMethod("getblock", [bestBlockHash]);

    //   return {
    //     bestBlockHeight: bestBlockDetails.height,
    //     bestBlockHash: bestBlockHash,
    //   };
    // }

    // Example wrapper function for 'pastelid verify' using the universal function
    // async verifyMessageWithPastelid(pastelid, messageToVerify, pastelidSignatureOnMessage) {
    //   const verificationResult = await this.callRpcMethod("pastelid verify", [
    //     messageToVerify,
    //     pastelidSignatureOnMessage,
    //     pastelid,
    //     "ed448"
    //   ]);

    //   return verificationResult.verification; // Adjust based on the actual RPC response structure
    // }

    try {
      // 'args' is expected to be an array of arguments for the RPC method
      const result = await this.rpcConnection.call(method, ...args);
      return result; // Return the raw result from the RPC call
    } catch (error) {
      logger.error(`Error calling RPC method '${method}': ${error.message}`);
      throw error; // Rethrow the error to be handled by the caller
    }
  }

  async getCurrentPastelBlockHeightAndHash() {
    try {
      // Get the best block hash

      const bestBlockHash = await this.rpcConnection.call("getbestblockhash");
      const bestBlockDetails = await this.rpcConnection.call(
        "getblock",
        bestBlockHash
      );
      if (!bestBlockHash) {
        throw new Error("Failed to fetch the best block hash");
      }
      if (!bestBlockDetails) {
        throw new Error(`Failed to fetch details for block ${bestBlockHash}`);
      }
      const bestBlockHeight = bestBlockDetails.height;
      // Return the height and hash of the best block
      return {
        bestBlockHeight: bestBlockHeight,
        bestBlockHash: bestBlockHash,
      };
    } catch (error) {
      logger.error(`An error occurred: ${error.message}`);
      throw error; // Rethrow the error to handle it in the caller function
    }
  }

  async getBestBlockHashAndMerkleRoot() {
    const { bestBlockHeight, bestBlockHash } =
      await this.getCurrentPastelBlockHeightAndHash();
    const bestBlockDetails = await this.rpcConnection.call(
      "getblock",
      bestBlockHash
    );
    return {
      bestBlockHash,
      bestBlockHeight,
      bestBlockMerkleRoot: bestBlockDetails.merkleroot,
    };
  }

  async getLastBlockData() {
    const currentPastelBlockHeightAndHash =
      await this.getCurrentPastelBlockHeightAndHash();
    const currentBlockHeight = currentPastelBlockHeightAndHash.bestBlockHeight;
    const blockData = await this.rpcConnection.call(
      "getblock",
      String(currentBlockHeight)
    );
    return blockData;
  }

  async checkPslAddressBalance(addressToCheck) {
    const balanceAtAddress = await this.rpcConnection.call(
      "z_getbalance",
      addressToCheck
    );
    return balanceAtAddress;
  }

  async getRawTransaction(txid) {
    const rawTransactionData = await this.rpcConnection.call(
      "getrawtransaction",
      txid,
      1
    );
    return rawTransactionData;
  }

  async verifyMessageWithPastelid(
    pastelid,
    messageToVerify,
    pastelidSignatureOnMessage
  ) {
    try {
      const verificationResult = await this.rpcConnection.call(
        "pastelid",
        "verify",
        messageToVerify,
        pastelidSignatureOnMessage,
        pastelid,
        "ed448"
      );
      return verificationResult.verification; // Adjust based on actual RPC response structure
    } catch (error) {
      logger.error(`An error occurred: ${error.message}`);
      throw error;
    }
  }

  async checkMasternodeTop() {
    try {
      const masternodeTopCommandOutput = await this.rpcConnection.call(
        "masternode",
        "top"
      );
      return masternodeTopCommandOutput;
    } catch (error) {
      logger.error(`An error occurred: ${error.message}`);
      throw error;
    }
  }

  async checkSupernodeListFunc() {
    try {
      const masternodeListFull = await this.rpcConnection.call(
        "masternodelist",
        "full"
      );
      const masternodeListRank = await this.rpcConnection.call(
        "masternodelist",
        "rank"
      );
      const masternodeListPubkey = await this.rpcConnection.call(
        "masternodelist",
        "pubkey"
      );
      const masternodeListExtra = await this.rpcConnection.call(
        "masternodelist",
        "extra"
      );

      let masternodeData = Object.entries(masternodeListFull).map(
        ([txid_vout, details]) => {
          const detailList = details
            .split(" ")
            .filter((element) => element !== "");
          const extraInfo = masternodeListExtra[txid_vout] || {};

          return {
            // Make sure to adjust indices as needed based on the actual structure of detailList
            supernode_status: detailList[0],
            protocol_version: detailList[1],
            supernode_psl_address: detailList[2],
            lastseentime: fromUnixTime(parseInt(detailList[3])).toISOString(),
            activeseconds: parseInt(detailList[4]),
            lastpaidtime: fromUnixTime(parseInt(detailList[5])).toISOString(),
            lastpaidblock: parseInt(detailList[6]),
            ipaddress_port: detailList[7],
            txid_vout: txid_vout,
            rank: parseInt(masternodeListRank[txid_vout] || "N/A"),
            pubkey: masternodeListPubkey[txid_vout] || "N/A",
            extAddress: extraInfo.extAddress || "N/A",
            extP2P: extraInfo.extP2P || "N/A",
            extKey: extraInfo.extKey || "N/A",
            eligibleForMining: extraInfo.eligibleForMining || "N/A",
            activedays: parseInt(detailList[4]) / 86400, // Assuming detailList[4] contains activeseconds
          };
        }
      );

      const masternodeDataJson = masternodeData.reduce((acc, node) => {
        acc[node.txid_vout] = node;
        return acc;
      }, {});

      return masternodeDataJson; // Return the object, calling function can stringify if needed
    } catch (error) {
      logger.error(`An error occurred: ${error.message}`);
      throw error;
    }
  }

  async getSnDataFromPastelidFunc(specifiedPastelid) {
    try {
      const supernodeList = await this.checkSupernodeListFunc(); // No need to JSON.parse as we're working with JS objects
      const filteredSupernodes = Object.values(supernodeList).filter(
        (node) => node.extKey === specifiedPastelid
      );

      if (filteredSupernodes.length === 0) {
        logger.error("Specified machine is not a supernode!");
        return [];
      } else {
        return filteredSupernodes;
      }
    } catch (error) {
      logger.error(`An error occurred while fetching supernode data: ${error}`);
      throw error;
    }
  }

  async getSnDataFromSnPubkeyFunc(specifiedSnPubkey) {
    try {
      const supernodeList = await this.checkSupernodeListFunc(); // No need to JSON.parse as we're working with JS objects
      const filteredSupernodes = Object.values(supernodeList).filter(
        (node) => node.pubkey === specifiedSnPubkey
      );

      if (filteredSupernodes.length === 0) {
        logger.error("Specified machine is not a supernode!");
        return [];
      } else {
        return filteredSupernodes;
      }
    } catch (error) {
      logger.error(`An error occurred while fetching supernode data: ${error}`);
      throw error;
    }
  }

  checkIfTransparentPslAddressIsValidFunc(pastelAddressString) {
    return pastelAddressString.length === 35 &&
      pastelAddressString.startsWith("Pt")
      ? 1
      : 0;
  }

  checkIfTransparentLspAddressIsValidFunc(pastelAddressString) {
    return pastelAddressString.length === 35 &&
      pastelAddressString.startsWith("tP")
      ? 1
      : 0;
  }

  async getDfJsonFromTicketsListRpcResponseFunc(rpcResponse) {
    const tickets = rpcResponse.map((ticket) => ({
      ...ticket.ticket,
      txid: ticket.txid,
      height: ticket.height,
    }));

    const ticketsJson = tickets.reduce((acc, ticket) => {
      acc[ticket.txid] = ticket;
      return acc;
    }, {});

    return ticketsJson;
  }

  async getPastelBlockchainTicketFunc(txid) {
    try {
      const responseJson = await this.rpcConnection.call(
        "tickets",
        "get",
        txid
      );
      if (Object.keys(responseJson).length > 0) {
        const ticketTypeString = responseJson.ticket.type;
        const correspondingRegTicketBlockHeight = responseJson.height;
        const currentPastelBlockHeightAndHash =
          await this.getCurrentPastelBlockHeightAndHash();
        const latestBlockHeight =
          currentPastelBlockHeightAndHash.bestBlockHeight;

        if (parseInt(correspondingRegTicketBlockHeight) < 0) {
          logger.warning(
            `The corresponding reg ticket block height of ${correspondingRegTicketBlockHeight} is less than 0!`
          );
        }
        if (parseInt(correspondingRegTicketBlockHeight) > latestBlockHeight) {
          logger.info(
            `The corresponding reg ticket block height of ${correspondingRegTicketBlockHeight} is greater than the latest block height of ${latestBlockHeight}!`
          );
        }

        const correspondingRegTicketBlockInfo = await this.rpcConnection.call(
          "getblock",
          String(correspondingRegTicketBlockHeight)
        );
        const correspondingRegTicketBlockTimestamp = new Date(
          correspondingRegTicketBlockInfo.time * 1000
        ).toISOString();
        responseJson.reg_ticket_block_timestamp_utc_iso =
          correspondingRegTicketBlockTimestamp;

        let activationResponseJson;
        switch (ticketTypeString) {
          case "nft-reg":
            activationResponseJson = await this.rpcConnection.call(
              "tickets",
              "find",
              "act",
              txid
            );
            break;
          case "action-reg":
            activationResponseJson = await this.rpcConnection.call(
              "tickets",
              "find",
              "action-act",
              txid
            );
            break;
          case "collection-reg":
            activationResponseJson = await this.rpcConnection.call(
              "tickets",
              "find",
              "collection-act",
              txid
            );
            break;
          default:
            activationResponseJson = `No activation ticket needed for this ticket type (${ticketTypeString})`;
        }

        if (
          activationResponseJson &&
          Object.keys(activationResponseJson).length > 0
        ) {
          responseJson.activation_ticket = activationResponseJson;
        } else {
          responseJson.activation_ticket =
            "No activation ticket found for this ticket-- check again soon";
        }

        return responseJson;
      } else {
        return "No ticket found for this txid";
      }
    } catch (error) {
      logger.error(`An error occurred: ${error.message}`);
      throw error;
    }
  }

  async getAllPastelBlockchainTicketsFunc(verbose = 0) {
    try {
      const ticketsObj = {};
      const listOfTicketTypes = [
        "id",
        "nft",
        "offer",
        "accept",
        "transfer",
        "royalty",
        "username",
        "ethereumaddress",
        "action",
        "action-act",
      ];

      for (const currentTicketType of listOfTicketTypes) {
        if (verbose) {
          logger.info(`Getting ${currentTicketType} tickets...`);
        }
        const response = await this.rpcConnection.call(
          "tickets",
          "list",
          currentTicketType
        );
        if (response && response.length > 0) {
          ticketsObj[currentTicketType] = response; // Directly storing the response for now
        }
      }

      return ticketsObj;
    } catch (error) {
      logger.error(`An error occurred: ${error.message}`);
      throw error;
    }
  }

  async getUsernamesFromPastelIdFunc(pastelId) {
    try {
      const response = await this.rpcConnection.call(
        "tickets",
        "list",
        "username"
      );
      const listOfReturnedUsernames = response
        .filter((ticket) => ticket.ticket.pastelID === pastelId)
        .map((ticket) => ticket.ticket.username);

      return listOfReturnedUsernames.length > 0
        ? listOfReturnedUsernames
        : "Error! No username found for this pastelid";
    } catch (error) {
      logger.error(`An error occurred: ${error.message}`);
      throw error;
    }
  }

  async getPastelIdFromUsernameFunc(username) {
    try {
      const response = await this.rpcConnection.call(
        "tickets",
        "list",
        "username"
      );
      const matchingTicket = response.find(
        (ticket) => ticket.ticket.username === username
      );

      return matchingTicket
        ? matchingTicket.ticket.pastelID
        : "Error! No pastelid found for this username";
    } catch (error) {
      logger.error(`An error occurred: ${error.message}`);
      throw error;
    }
  }

  async testnetPastelIdFileDispenserFunc(password, verbose = 0) {
    if (verbose) logger.info("Now generating a pastelid...");
    const response = await this.rpcConnection.call(
      "pastelid",
      "newkey",
      password
    );

    let pastelIdData = "";
    let pastelIdPubKey = "";

    if (response && "pastelid" in response) {
      pastelIdPubKey = response.pastelid;
      if (verbose) logger.info(`The pastelid is ${pastelIdPubKey}`);

      const pastelKeysPath = path.join(
        os.homedir(),
        ".pastel/testnet3/pastelkeys",
        pastelIdPubKey
      );

      try {
        if (verbose)
          logger.info("Now checking to see if the pastelid file exists...");
        pastelIdData = await fs.readFile(pastelKeysPath);
        if (verbose) logger.info("The pastelid file exists!");
      } catch (error) {
        if (verbose) logger.info("The pastelid file does not exist!");
        pastelIdData = ""; // Ensure pastelIdData is empty if the file does not exist or an error occurs
      }
    } else {
      logger.error("There was an issue creating the pastelid!");
    }

    return { pastelIdPubKey, pastelIdData: pastelIdData.toString("base64") };
  }

  async getAllRegistrationTicketTxidsCorrespondingToACollectionTicketTxidFunc(
    collectionTicketTxid
  ) {
    try {
      const ticketDict =
        await this.getPastelBlockchainTicketFunc(collectionTicketTxid); // Ensure getPastelBlockchainTicketFunc is defined in this class
      const ticketTypeString = ticketDict.ticket.type;
      let activationTicketData, itemType;

      if (ticketTypeString === "collection-reg") {
        activationTicketData = ticketDict.activation_ticket;
        itemType = ticketDict.ticket.collection_ticket.item_type;
      } else if (ticketTypeString === "collection-act") {
        activationTicketData = ticketDict;
        itemType = ""; // For 'collection-act', itemType is not directly applicable
      } else {
        const errorString =
          "The ticket type is neither collection-reg nor collection-act";
        logger.error(errorString);
        return errorString;
      }

      const activationTicketTxid = activationTicketData.txid;
      let responseJson;

      if (["sense", "nft", ""].includes(itemType)) {
        try {
          responseJson = await this.rpcConnection.call(
            "tickets",
            "find",
            itemType || "action",
            activationTicketTxid
          );
        } catch (error) {
          logger.error(
            `Exception occurred while trying to find the activation ticket in the blockchain: ${error}`
          );
          // Attempt to find as 'nft' if 'action' failed and itemType was not specified
          if (itemType === "") {
            try {
              responseJson = await this.rpcConnection.call(
                "tickets",
                "find",
                "nft",
                activationTicketTxid
              );
            } catch (error) {
              logger.error(
                `Unable to find the activation ticket in the blockchain: ${error}`
              );
              responseJson =
                "Unable to find the activation ticket in the blockchain";
            }
          }
        }
      } else {
        responseJson = `The txid given (${collectionTicketTxid}) is not a valid activation ticket txid for a collection ticket`;
      }

      return responseJson;
    } catch (error) {
      logger.error(`Error retrieving registration ticket txids: ${error}`);
      throw error; // Rethrow to allow further handling if necessary
    }
  }

  // Rest of "vanilla" RPC methods here:

  // Addressindex
  async getAddressMempool(addresses) {
    const mempoolInfo = await this.callRpcMethod("getaddressmempool", [
      { addresses },
    ]);
    return mempoolInfo;
  }

  // Blockchain
  async getTotalCoinSupply() {
    const totalCoinSupply = await this.callRpcMethod("get-total-coin-supply");
    return totalCoinSupply;
  }

  async getBestBlockHash() {
    const bestBlockHash = await this.callRpcMethod("getbestblockhash");
    return bestBlockHash;
  }

  async getBlock(hashOrHeight, verbosity = 1) {
    const block = await this.callRpcMethod("getblock", [
      hashOrHeight,
      verbosity,
    ]);
    return block;
  }

  async getBlockchainInfo() {
    const blockchainInfo = await this.callRpcMethod("getblockchaininfo");
    return blockchainInfo;
  }

  async getBlockCount() {
    const blockCount = await this.callRpcMethod("getblockcount");
    return blockCount;
  }

  async getBlockDeltas(blockhash) {
    const blockDeltas = await this.callRpcMethod("getblockdeltas", [blockhash]);
    return blockDeltas;
  }

  async getBlockHash(index) {
    const blockHash = await this.callRpcMethod("getblockhash", [index]);
    return blockHash;
  }

  async getBlockHeader(hash, verbose = true) {
    const blockHeader = await this.callRpcMethod("getblockheader", [
      hash,
      verbose,
    ]);
    return blockHeader;
  }

  async getChainTips() {
    const chainTips = await this.callRpcMethod("getchaintips");
    return chainTips;
  }

  async getDifficulty() {
    const difficulty = await this.callRpcMethod("getdifficulty");
    return difficulty;
  }

  async getMempoolInfo() {
    const mempoolInfo = await this.callRpcMethod("getmempoolinfo");
    return mempoolInfo;
  }

  async getRawMempool(verbose = false) {
    const rawMempool = await this.callRpcMethod("getrawmempool", [verbose]);
    return rawMempool;
  }

  async getTxOut(txid, n, includemempool = true) {
    const txOut = await this.callRpcMethod("gettxout", [
      txid,
      n,
      includemempool,
    ]);
    return txOut;
  }

  async getTxOutProof(txids, blockhash = "") {
    const txOutProof = await this.callRpcMethod("gettxoutproof", [
      txids,
      blockhash,
    ]);
    return txOutProof;
  }

  async getTxOutSetInfo() {
    const txOutSetInfo = await this.callRpcMethod("gettxoutsetinfo");
    return txOutSetInfo;
  }

  async verifyChain(checklevel = 3, numblocks = 288) {
    const isChainVerified = await this.callRpcMethod("verifychain", [
      checklevel,
      numblocks,
    ]);
    return isChainVerified;
  }

  async verifyTxOutProof(proof) {
    const txIds = await this.callRpcMethod("verifytxoutproof", [proof]);
    return txIds;
  }

  // Control
  async getInfo() {
    const info = await this.callRpcMethod("getinfo");
    return info;
  }

  async getMemoryInfo() {
    const memoryInfo = await this.callRpcMethod("getmemoryinfo");
    return memoryInfo;
  }

  async help(command = "") {
    const helpInfo = await this.callRpcMethod("help", [command]);
    return helpInfo;
  }

  async stop() {
    const stopMessage = await this.callRpcMethod("stop");
    return stopMessage;
  }

  // Generating
  async generate(numblocks, pastelID = "") {
    const blocks = await this.callRpcMethod("generate", [numblocks, pastelID]);
    return blocks;
  }

  async getGenerate() {
    const generateStatus = await this.callRpcMethod("getgenerate");
    return generateStatus;
  }

  async refreshMiningMnIdInfo() {
    const info = await this.callRpcMethod("refreshminingmnidinfo");
    return info;
  }

  async setGenerate(generate, genproclimit = -1) {
    const setResult = await this.callRpcMethod("setgenerate", [
      generate,
      genproclimit,
    ]);
    return setResult;
  }

  // Mining
  async getBlockSubsidy(height = null) {
    const blockSubsidy = await this.callRpcMethod(
      "getblocksubsidy",
      height !== null ? [height] : []
    );
    return blockSubsidy;
  }

  async getBlockTemplate(jsonrequestobject = {}) {
    const blockTemplate = await this.callRpcMethod("getblocktemplate", [
      jsonrequestobject,
    ]);
    return blockTemplate;
  }

  async getLocalSolps() {
    const solps = await this.callRpcMethod("getlocalsolps");
    return solps;
  }

  async getMiningEligibility(mnfilter = "") {
    const eligibility = await this.callRpcMethod("getminingeligibility", [
      mnfilter,
    ]);
    return eligibility;
  }

  async getMiningInfo() {
    const miningInfo = await this.callRpcMethod("getmininginfo");
    return miningInfo;
  }

  async getNetworkHashPs(blocks = 120, height = -1) {
    const hashps = await this.callRpcMethod("getnetworkhashps", [
      blocks,
      height,
    ]);
    return hashps;
  }

  async getNetworkSolps(blocks = 120, height = -1) {
    const solps = await this.callRpcMethod("getnetworksolps", [blocks, height]);
    return solps;
  }

  async getNextBlockSubsidy() {
    const nextBlockSubsidy = await this.callRpcMethod("getnextblocksubsidy");
    return nextBlockSubsidy;
  }

  async prioritiseTransaction(txid, priorityDelta, feeDelta) {
    const result = await this.callRpcMethod("prioritisetransaction", [
      txid,
      priorityDelta,
      feeDelta,
    ]);
    return result;
  }

  async submitBlock(hexdata, jsonparametersobject = {}) {
    const submitResult = await this.callRpcMethod("submitblock", [
      hexdata,
      jsonparametersobject,
    ]);
    return submitResult;
  }

  // Masternode Commands

  async masternodeCount(mode = "") {
    // Available modes: 'ps', 'enabled', 'all', 'current', 'qualify'
    return this.rpcConnection.call("masternode", ["count", mode]);
  }

  async masternodeCurrent() {
    return this.rpcConnection.call("masternode", ["current"]);
  }

  async masternodeGenkey() {
    return this.rpcConnection.call("masternode", ["genkey"]);
  }

  async masternodeOutputs() {
    return this.rpcConnection.call("masternode", ["outputs"]);
  }

  async masternodeStartAlias(alias) {
    return this.rpcConnection.call("masternode", ["start-alias", alias]);
  }

  async masternodeStart(mode) {
    // Available modes: 'all', 'missing', 'disabled'
    return this.rpcConnection.call("masternode", ["start-" + mode]);
  }

  async masternodeStatus() {
    return this.rpcConnection.call("masternode", ["status"]);
  }

  async masternodeList(mode = "", filter = "") {
    // mode examples: 'addr', 'rank', 'status'
    return this.rpcConnection.call("masternode", ["list", mode, filter]);
  }

  async masternodeListConf() {
    return this.rpcConnection.call("masternode", ["list-conf"]);
  }

  async masternodeWinner() {
    return this.rpcConnection.call("masternode", ["winner"]);
  }

  async masternodeWinners(count = "", blockHash = "") {
    return this.rpcConnection.call("masternode", ["winners", count, blockHash]);
  }

  async masternodeTop(n = "", x = "") {
    // 'n' is the nth block. 'x' controls whether to return MNs based on the current list and hash of nth block.
    return this.rpcConnection.call("masternode", ["top", n, x]);
  }

  async masternodeBroadcastCreateAlias(alias) {
    return this.rpcConnection.call("masternodebroadcast", [
      "create-alias",
      alias,
    ]);
  }

  async masternodeBroadcastCreateAll() {
    return this.rpcConnection.call("masternodebroadcast", ["create-all"]);
  }

  async masternodeBroadcastDecode(message) {
    return this.rpcConnection.call("masternodebroadcast", ["decode", message]);
  }

  async masternodeBroadcastRelay(message) {
    return this.rpcConnection.call("masternodebroadcast", ["relay", message]);
  }

  async masternodelistActiveseconds(filter = "") {
    return this.rpcConnection.call("masternodelist", ["activeseconds", filter]);
  }

  async masternodelistAddr(filter = "") {
    return this.rpcConnection.call("masternodelist", ["addr", filter]);
  }

  async masternodelistFull(filter = "") {
    return this.rpcConnection.call("masternodelist", ["full", filter]);
  }

  async masternodelistInfo(filter = "") {
    return this.rpcConnection.call("masternodelist", ["info", filter]);
  }

  async masternodelistLastPaidBlock(filter = "") {
    return this.rpcConnection.call("masternodelist", ["lastpaidblock", filter]);
  }

  async masternodelistLastPaidTime(filter = "") {
    return this.rpcConnection.call("masternodelist", ["lastpaidtime", filter]);
  }

  async masternodelistLastSeen(filter = "") {
    return this.rpcConnection.call("masternodelist", ["lastseen", filter]);
  }

  async masternodelistPayee(filter = "") {
    return this.rpcConnection.call("masternodelist", ["payee", filter]);
  }

  async masternodelistProtocol(filter = "") {
    return this.rpcConnection.call("masternodelist", ["protocol", filter]);
  }

  async masternodelistPubkey(filter = "") {
    return this.rpcConnection.call("masternodelist", ["pubkey", filter]);
  }

  async masternodelistRank(filter = "") {
    return this.rpcConnection.call("masternodelist", ["rank", filter]);
  }

  async masternodelistStatus(filter = "") {
    return this.rpcConnection.call("masternodelist", ["status", filter]);
  }

  async masternodelistExtra(filter = "") {
    return this.rpcConnection.call("masternodelist", ["extra", filter]);
  }

  async chaindataCommand(command, ...args) {
    return this.rpcConnection.call("chaindata", [command, ...args]);
  }

  async generateReport(reportName, ...args) {
    return this.rpcConnection.call("generate-report", [reportName, ...args]);
  }

  async getFeeSchedule() {
    return this.rpcConnection.call("getfeeschedule");
  }

  async ingestCommand(command, ...args) {
    // 'ingest', 'ani2psl', 'ani2psl_secret', etc.
    return this.rpcConnection.call("ingest", [command, ...args]);
  }

  async masternodeCommand(command, ...args) {
    // 'count', 'current', 'genkey', 'outputs', 'start-alias', 'start-all', 'status', 'list', 'list-conf', 'winner', 'winners', etc.
    return this.rpcConnection.call("masternode", [command, ...args]);
  }

  async masternodeBroadcastCommand(command, ...args) {
    // 'create-alias', 'create-all', 'decode', 'relay', etc.
    return this.rpcConnection.call("masternodebroadcast", [command, ...args]);
  }

  async mnsyncCommand(command = "status") {
    // 'status', 'next', 'reset'
    return this.rpcConnection.call("mnsync", [command]);
  }

  async pastelidCommand(command, ...args) {
    // Various PastelID related commands
    return this.rpcConnection.call("pastelid", [command, ...args]);
  }

  async storagefeeCommand(command, ...args) {
    // Various storage fee related commands
    return this.rpcConnection.call("storagefee", [command, ...args]);
  }

  async ticketsCommand(command, ...args) {
    // Various ticket system commands
    return this.rpcConnection.call("tickets", [command, ...args]);
  }

  // Network Commands
  async addNode(node, command) {
    const result = await this.callRpcMethod("addnode", [node, command]);
    return result;
  }

  async clearBanned() {
    const result = await this.callRpcMethod("clearbanned");
    return result;
  }

  async disconnectNode(node) {
    const result = await this.callRpcMethod("disconnectnode", [node]);
    return result;
  }

  async getAddedNodeInfo(dns, node = "") {
    const result = await this.callRpcMethod("getaddednodeinfo", [dns, node]);
    return result;
  }

  async getConnectionCount() {
    const result = await this.callRpcMethod("getconnectioncount");
    return result;
  }

  async getDeprecationInfo() {
    const result = await this.callRpcMethod("getdeprecationinfo");
    return result;
  }

  async getNetTotals() {
    const result = await this.callRpcMethod("getnettotals");
    return result;
  }

  async getNetworkInfo() {
    const result = await this.callRpcMethod("getnetworkinfo");
    return result;
  }

  async getPeerInfo() {
    const result = await this.callRpcMethod("getpeerinfo");
    return result;
  }

  async listBanned() {
    const result = await this.callRpcMethod("listbanned");
    return result;
  }

  async ping() {
    const result = await this.callRpcMethod("ping");
    return result;
  }

  async setBan(ip, command, bantime = "", absolute = "") {
    const result = await this.callRpcMethod("setban", [
      ip,
      command,
      bantime,
      absolute,
    ]);
    return result;
  }

  // Rawtransactions

  async createRawTransaction(
    transactions,
    addresses,
    locktime = 0,
    expiryheight = null
  ) {
    // 'transactions' is an array of objects, 'addresses' is an object mapping addresses to amounts
    // 'locktime' and 'expiryheight' are optional
    const params = [transactions, addresses, locktime];
    if (expiryheight !== null) {
      params.push(expiryheight);
    }
    return this.rpcConnection.call("createrawtransaction", params);
  }

  async getRawTransaction(txid, verbose = 0, blockhash = null) {
    // 'verbose' is an optional boolean that defaults to false (0)
    // 'blockhash' is optional and allows specifying the block in which to look for the transaction
    const params = [txid, verbose];
    if (blockhash !== null) {
      params.push(blockhash);
    }
    return this.rpcConnection.call("getrawtransaction", params);
  }

  async sendRawTransaction(hexstring, allowhighfees = false) {
    // 'hexstring' is the hex-encoded transaction string
    // 'allowhighfees' is a boolean flag to allow high fees
    return this.rpcConnection.call("sendrawtransaction", [
      hexstring,
      allowhighfees,
    ]);
  }

  async signRawTransaction(
    hexstring,
    prevtxs = null,
    privatekeys = null,
    sighashtype = "ALL",
    branchid = null
  ) {
    // 'hexstring' is the hex string of the raw transaction
    // 'prevtxs' is an optional array of previous dependent transaction outputs
    // 'privatekeys' is an optional array of base58-encoded private keys for signing
    // 'sighashtype' is an optional string indicating the signature hash type, defaulting to "ALL"
    // 'branchid' is an optional hex string of the consensus branch id to sign with
    const params = [hexstring];
    if (prevtxs !== null) {
      params.push(prevtxs);
    }
    if (privatekeys !== null) {
      params.push(privatekeys);
    }
    params.push(sighashtype);
    if (branchid !== null) {
      params.push(branchid);
    }
    return this.rpcConnection.call("signrawtransaction", params);
  }

  async decodeRawTransaction(hexstring) {
    // 'hexstring' is the string of the hex-encoded raw transaction
    return this.rpcConnection.call("decoderawtransaction", [hexstring]);
  }

  async decodeScript(hexstring) {
    // 'hexstring' is the string of the hex-encoded script
    return this.rpcConnection.call("decodescript", [hexstring]);
  }

  async fundRawTransaction(hexstring, options = {}) {
    /* 'hexstring' is the string of the hex-encoded raw transaction
       'options' is an object containing various options for funding the raw transaction:
       {
         "changeAddress": "address",  // The Pastel address to receive the change
         "changePosition": n,         // The index of the change output
         "includeWatching": boolean,  // Also select inputs that are watch only
         "lockUnspents": boolean,     // Lock selected unspent outputs
         "feeRate": n,                // Set a specific feerate (PSL per KB)
         "subtractFeeFromOutputs": [  // The integers set to 1 here will have the fee subtracted from their corresponding outputs
           n, ...
         ]
       }
    */
    return this.rpcConnection.call("fundrawtransaction", [hexstring, options]);
  }

  // Util

  async createMultisig(nrequired, keys) {
    // 'nrequired' is the number of required signatures
    // 'keys' is an array of public keys or Pastel addresses
    return this.rpcConnection.call("createmultisig", [nrequired, keys]);
  }

  async estimateFee(nblocks) {
    // 'nblocks' is the number of blocks for the fee estimation
    return this.rpcConnection.call("estimatefee", [nblocks]);
  }

  async estimatePriority(nblocks) {
    // 'nblocks' is the number of blocks for the priority estimation
    return this.rpcConnection.call("estimatepriority", [nblocks]);
  }

  async validateAddress(address) {
    // 'address' is a Pastel t-address to validate
    return this.rpcConnection.call("validateaddress", [address]);
  }

  async verifyMessage(address, signature, message) {
    // 'address' is the Pastel t-address to use for signature verification
    // 'signature' is the signature provided
    // 'message' is the original message that was signed
    return this.rpcConnection.call("verifymessage", [
      address,
      signature,
      message,
    ]);
  }

  async zValidateAddress(zaddr) {
    // 'zaddr' is a Pastel z-address to validate
    return this.rpcConnection.call("z_validateaddress", [zaddr]);
  }

  // Wallet
  async addMultisigAddress(nrequired, keys, account = "") {
    // 'nrequired' is the number of required signatures
    // 'keys' is an array of public keys or Pastel addresses
    // 'account' is the account to which the multisig address will be associated (optional)
    return this.rpcConnection.call("addmultisigaddress", [
      nrequired,
      keys,
      account,
    ]);
  }

  async backupWallet(destination) {
    // 'destination' is the directory or path where the wallet.dat will be backed up
    return this.rpcConnection.call("backupwallet", [destination]);
  }

  async dumpPrivKey(tAddr) {
    // 'tAddr' is the Pastel transparent address to dump the private key from
    return this.rpcConnection.call("dumpprivkey", [tAddr]);
  }

  async dumpWallet(filename) {
    // 'filename' is the filename with path where the wallet dump will be saved
    return this.rpcConnection.call("dumpwallet", [filename]);
  }

  async encryptWallet(passphrase) {
    // 'passphrase' is the passphrase with which to encrypt the wallet
    return this.rpcConnection.call("encryptwallet", [passphrase]);
  }

  async fixMissingTxs(startingHeight, isInvolvingMe = false) {
    // 'startingHeight' is the block height from which to start fixing missing transactions
    // 'isInvolvingMe' is a flag to specify if only transactions involving the wallet should be fixed (optional)
    return this.rpcConnection.call("fixmissingtxs", [
      startingHeight,
      isInvolvingMe,
    ]);
  }

  async getAccount(zcashAddress) {
    // 'zcashAddress' is the Pastel address for which the account name is queried
    return this.rpcConnection.call("getaccount", [zcashAddress]);
  }

  async getAccountAddress(account) {
    // 'account' is the account name for which a new address will be generated and returned
    return this.rpcConnection.call("getaccountaddress", [account]);
  }

  async getAddressesByAccount(account) {
    // 'account' is the account name for which the list of associated addresses will be returned
    return this.rpcConnection.call("getaddressesbyaccount", [account]);
  }

  async getBalance(account = "", minconf = 1, includeWatchonly = false) {
    // 'account' is the account name for which the balance is queried (optional)
    // 'minconf' is the minimum number of confirmations an output must have to be counted (optional)
    // 'includeWatchonly' includes balances in watch-only addresses (optional)
    return this.rpcConnection.call("getbalance", [
      account,
      minconf,
      includeWatchonly,
    ]);
  }

  async getNewAddress(account = "") {
    // 'account' is the account name for which a new address will be generated (optional)
    return this.rpcConnection.call("getnewaddress", [account]);
  }

  async getRawChangeAddress() {
    // Returns a new Pastel raw change address for receiving change
    return this.rpcConnection.call("getrawchangeaddress", []);
  }

  async getReceivedByAccount(account, minconf = 1) {
    // 'account' is the account name for which the total amount received is calculated
    // 'minconf' is the minimum number of confirmations an output must have to be counted (optional)
    return this.rpcConnection.call("getreceivedbyaccount", [account, minconf]);
  }

  async getTransaction(txid, includeWatchonly = false) {
    // 'txid' is the transaction ID to query
    // 'includeWatchonly' includes transactions to watch-only addresses (optional)
    return this.rpcConnection.call("gettransaction", [txid, includeWatchonly]);
  }

  async getTxFee(txid) {
    // 'txid' is the transaction ID for which the fee is queried
    return this.rpcConnection.call("gettxfee", [txid]);
  }

  async getUnconfirmedBalance() {
    // Returns the server's total unconfirmed balance
    return this.rpcConnection.call("getunconfirmedbalance", []);
  }

  async getWalletInfo() {
    // Returns an object containing various wallet state info
    return this.rpcConnection.call("getwalletinfo", []);
  }

  async importAddress(address, label = "", rescan = true) {
    // 'address' is the Pastel address to import
    // 'label' is an optional label for the address
    // 'rescan' whether to rescan the blockchain for transactions to this address (optional, default=true)
    return this.rpcConnection.call("importaddress", [address, label, rescan]);
  }

  async importPrivKey(zcashPrivKey, label = "", rescan = true) {
    // 'zcashPrivKey' is the private key corresponding to the Pastel address to import
    // 'label' is an optional label for the address
    // 'rescan' whether to rescan the blockchain for transactions to this address (optional, default=true)
    return this.rpcConnection.call("importprivkey", [
      zcashPrivKey,
      label,
      rescan,
    ]);
  }

  async importWallet(filename) {
    // 'filename' is the wallet file to import
    return this.rpcConnection.call("importwallet", [filename]);
  }

  async keypoolRefill(newSize = 100) {
    // 'newSize' is the new size of the key pool (optional)
    return this.rpcConnection.call("keypoolrefill", [newSize]);
  }

  async listAccounts(minconf = 1, includeWatchonly = false) {
    // 'minconf' is the minimum number of confirmations an output must have to be included
    // 'includeWatchonly' includes balances in watch-only addresses (optional)
    return this.rpcConnection.call("listaccounts", [minconf, includeWatchonly]);
  }

  async listAddressAmounts(includeEmpty = false, ismineFilter = true) {
    // 'includeEmpty' includes addresses with zero balances (optional)
    // 'ismineFilter' filters for addresses that belong to the wallet (optional, default=true)
    return this.rpcConnection.call("listaddressamounts", [
      includeEmpty,
      ismineFilter,
    ]);
  }

  async listAddressGroupings() {
    // Returns a list of grouped addresses which have had their common ownership made public by common use as inputs or as the resulting change in past transactions
    return this.rpcConnection.call("listaddressgroupings", []);
  }

  async listLockUnspent() {
    return this.rpcConnection.call("listlockunspent", []);
  }

  async listReceivedByAccount(
    minconf = 1,
    includeEmpty = false,
    includeWatchonly = false
  ) {
    return this.rpcConnection.call("listreceivedbyaccount", [
      minconf,
      includeEmpty,
      includeWatchonly,
    ]);
  }

  async listReceivedByAddress(
    minconf = 1,
    includeEmpty = false,
    includeWatchonly = false
  ) {
    return this.rpcConnection.call("listreceivedbyaddress", [
      minconf,
      includeEmpty,
      includeWatchonly,
    ]);
  }

  async listSinceBlock(
    blockhash = "",
    targetConfirmations = 1,
    includeWatchonly = false
  ) {
    return this.rpcConnection.call("listsinceblock", [
      blockhash,
      targetConfirmations,
      includeWatchonly,
    ]);
  }

  async listTransactions(
    account = "*",
    count = 10,
    from = 0,
    includeWatchonly = false
  ) {
    return this.rpcConnection.call("listtransactions", [
      account,
      count,
      from,
      includeWatchonly,
    ]);
  }

  async listUnspent(minconf = 1, maxconf = 9999999, addresses = []) {
    return this.rpcConnection.call("listunspent", [
      minconf,
      maxconf,
      addresses,
    ]);
  }

  async lockUnspent(unlock, transactions) {
    // 'unlock' is a boolean flag (true to unlock, false to lock)
    // 'transactions' is an array of objects with 'txid' and 'vout'
    return this.rpcConnection.call("lockunspent", [unlock, transactions]);
  }

  async move(fromAccount, toAccount, amount, minconf = 1, comment = "") {
    return this.rpcConnection.call("move", [
      fromAccount,
      toAccount,
      amount,
      minconf,
      comment,
    ]);
  }

  async scanForMissingTxs(startingHeight, isInvolvingMe = true) {
    return this.rpcConnection.call("scanformissingtxs", [
      startingHeight,
      isInvolvingMe,
    ]);
  }

  async sendFrom(
    fromAccount,
    toZcashAddress,
    amount,
    minconf = 1,
    comment = "",
    commentTo = ""
  ) {
    return this.rpcConnection.call("sendfrom", [
      fromAccount,
      toZcashAddress,
      amount,
      minconf,
      comment,
      commentTo,
    ]);
  }

  async sendMany(
    fromAccount,
    amounts,
    minconf = 1,
    comment = "",
    addresses = [],
    changeAddress = ""
  ) {
    // 'amounts' is an object with addresses as keys and amounts as values
    return this.rpcConnection.call("sendmany", [
      fromAccount,
      amounts,
      minconf,
      comment,
      addresses,
      changeAddress,
    ]);
  }

  async sendToAddress(
    tAddress,
    amount,
    comment = "",
    commentTo = "",
    subtractFeeFromAmount = false,
    changeAddress = ""
  ) {
    return this.rpcConnection.call("sendtoaddress", [
      tAddress,
      amount,
      comment,
      commentTo,
      subtractFeeFromAmount,
      changeAddress,
    ]);
  }

  async setAccount(zcashAddress, account) {
    return this.rpcConnection.call("setaccount", [zcashAddress, account]);
  }

  async setTxFee(amount) {
    return this.rpcConnection.call("settxfee", [amount]);
  }

  async signMessage(tAddr, message) {
    return this.rpcConnection.call("signmessage", [tAddr, message]);
  }

  async exportZKey(zaddr) {
    // Exports the private key of a given z-address
    return this.rpcConnection.call("z_exportkey", [zaddr]);
  }

  async exportViewingKey(zaddr) {
    // Exports the viewing key of a given z-address
    return this.rpcConnection.call("z_exportviewingkey", [zaddr]);
  }

  async exportWallet(filename) {
    // Exports the wallet to a file
    return this.rpcConnection.call("z_exportwallet", [filename]);
  }

  async getZBalance(address, minconf = 1) {
    // Returns the balance of a given address
    return this.rpcConnection.call("z_getbalance", [address, minconf]);
  }

  async getNewZAddress(type = "") {
    // Generates a new z-address of a given type (if specified)
    return this.rpcConnection.call("z_getnewaddress", [type]);
  }

  async getNotesCount() {
    // Returns the count of notes in the wallet
    return this.rpcConnection.call("z_getnotescount", []);
  }

  async getOperationResult(operationIds = []) {
    // Retrieves the result of one or more operations
    return this.rpcConnection.call("z_getoperationresult", [operationIds]);
  }

  async getOperationStatus(operationIds = []) {
    // Retrieves the status of one or more operations
    return this.rpcConnection.call("z_getoperationstatus", [operationIds]);
  }

  async getTotalBalance(minconf = 1, includeWatchonly = false) {
    // Returns the total balance of the wallet, including both transparent and shielded balances
    return this.rpcConnection.call("z_gettotalbalance", [
      minconf,
      includeWatchonly,
    ]);
  }

  async importZKey(zkey, rescan = "whenkeyisnew", startHeight = 0) {
    // Imports a z-key into the wallet
    return this.rpcConnection.call("z_importkey", [zkey, rescan, startHeight]);
  }

  async importViewingKey(vkey, rescan = "whenkeyisnew", startHeight = 0) {
    // Imports a viewing key into the wallet
    return this.rpcConnection.call("z_importviewingkey", [
      vkey,
      rescan,
      startHeight,
    ]);
  }

  async importZWallet(filename) {
    // Imports a z-wallet from a file
    return this.rpcConnection.call("z_importwallet", [filename]);
  }

  async listZAddresses(includeWatchonly = false) {
    // Lists all z-addresses in the wallet
    return this.rpcConnection.call("z_listaddresses", [includeWatchonly]);
  }

  async listOperationIds() {
    // Lists all operation IDs in the wallet
    return this.rpcConnection.call("z_listoperationids", []);
  }

  async listReceivedByAddress(address, minconf = 1) {
    // Lists all amounts received by a given z-address
    return this.rpcConnection.call("z_listreceivedbyaddress", [
      address,
      minconf,
    ]);
  }

  async zListUnspent(
    minconf = 1,
    maxconf = 9999999,
    includeWatchonly = false,
    addresses = []
  ) {
    return this.rpcConnection.call("z_listunspent", [
      minconf,
      maxconf,
      includeWatchonly,
      addresses,
    ]);
  }

  async zMergeToAddress(
    fromAddresses,
    toAddress,
    fee = 0.0001,
    transparentLimit = 50,
    shieldedLimit = 200,
    memo = ""
  ) {
    return this.rpcConnection.call("z_mergetoaddress", [
      fromAddresses,
      toAddress,
      fee,
      transparentLimit,
      shieldedLimit,
      memo,
    ]);
  }

  async zSendMany(fromAddress, amounts, minconf = 1, fee = 0.0001) {
    return this.rpcConnection.call("z_sendmany", [
      fromAddress,
      amounts,
      minconf,
      fee,
    ]);
  }

  async zSendManyWithChangeToSender(
    fromAddress,
    amounts,
    minconf = 1,
    fee = 0.0001
  ) {
    return this.rpcConnection.call("z_sendmanywithchangetosender", [
      fromAddress,
      amounts,
      minconf,
      fee,
    ]);
  }

  async zShieldCoinbase(fromAddress, toZAddress, fee = 0.0001, limit = 50) {
    return this.rpcConnection.call("z_shieldcoinbase", [
      fromAddress,
      toZAddress,
      fee,
      limit,
    ]);
  }

  async zViewTransaction(txid) {
    return this.rpcConnection.call("z_viewtransaction", [txid]);
  }
}
