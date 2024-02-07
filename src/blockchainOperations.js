import rpcConnection from "./rpcConnection.js"; // Ensure the path is correct based on your project structure
import logger from "./logger.js";
import { DataFrame } from "danfojs-node";
import fs from "fs/promises";
import path from "path";
import os from "os";

export const getCurrentPastelBlockHeight = async () => {
  const bestBlockHash = await rpcConnection.call("getbestblockhash");
  const bestBlockDetails = await rpcConnection.call("getblock", bestBlockHash);
  return bestBlockDetails.height;
};

export const getPreviousBlockHashAndMerkleRoot = async () => {
  const previousBlockHeight = (await getCurrentPastelBlockHeight()) - 1;
  const previousBlockHash = await rpcConnection.call(
    "getblockhash",
    previousBlockHeight
  );
  const previousBlockDetails = await rpcConnection.call(
    "getblock",
    previousBlockHash
  );
  return {
    previousBlockHash,
    previousBlockMerkleRoot: previousBlockDetails.merkleroot,
    previousBlockHeight,
  };
};

export const getLastBlockData = async () => {
  const currentBlockHeight = await getCurrentPastelBlockHeight();
  const blockData = await rpcConnection.call(
    "getblock",
    String(currentBlockHeight)
  );
  return blockData;
};

export const checkPslAddressBalance = async (addressToCheck) => {
  const balanceAtAddress = await rpcConnection.call(
    "z_getbalance",
    addressToCheck
  );
  return balanceAtAddress;
};

export const getRawTransaction = async (txid) => {
  const rawTransactionData = await rpcConnection.call(
    "getrawtransaction",
    txid,
    1
  );
  return rawTransactionData;
};

export const verifyMessageWithPastelid = async (
  pastelid,
  messageToVerify,
  pastelidSignatureOnMessage
) => {
  const verificationResult = await rpcConnection.call(
    "pastelid",
    "verify",
    messageToVerify,
    pastelidSignatureOnMessage,
    pastelid,
    "ed448"
  );
  return verificationResult.verification; // Assuming the RPC returns an object with a 'verification' key
};

export const checkMasternodeTop = async () => {
  const masternodeTopCommandOutput = await rpcConnection.call(
    "masternode",
    "top"
  );
  return masternodeTopCommandOutput;
};

export const checkSupernodeListFunc = async () => {
  try {
    const masternodeListFullCommandOutput = await rpcConnection.call(
      "masternodelist",
      "full"
    );
    const masternodeListRankCommandOutput = await rpcConnection.call(
      "masternodelist",
      "rank"
    );
    const masternodeListPubkeyCommandOutput = await rpcConnection.call(
      "masternodelist",
      "pubkey"
    );
    const masternodeListExtraCommandOutput = await rpcConnection.call(
      "masternodelist",
      "extra"
    );

    let data = Object.entries(masternodeListFullCommandOutput).map(
      ([txid_vout, details]) => {
        const detailList = details.split(" ");
        return [...detailList, txid_vout];
      }
    );

    let columns = [
      "supernode_status",
      "protocol_version",
      "supernode_psl_address",
      "lastseentime",
      "activeseconds",
      "lastpaidtime",
      "lastpaidblock",
      "ipaddress_port",
      "txid_vout",
    ];
    let df = new DataFrame(data, { columns: columns });
    df.setIndex({ column: "txid_vout" });
    df.drop({ columns: ["txid_vout"], inplace: true });

    df.columns.forEach((col) => {
      if (["lastseentime", "lastpaidtime"].includes(col)) {
        df[col] = df[col].apply((val) => new Date(val * 1000).toISOString());
      } else if (["activeseconds", "lastpaidblock", "rank"].includes(col)) {
        df[col] = df[col].astype("int32");
      }
    });

    df.addColumn(
      "activedays",
      df["activeseconds"].apply((val) => val / 86400),
      { inplace: true }
    );

    Object.entries(masternodeListRankCommandOutput).forEach(
      ([txid_vout, rank]) => {
        const pubkey = masternodeListPubkeyCommandOutput[txid_vout];
        const extra = masternodeListExtraCommandOutput[txid_vout];
        df.loc({ rows: [txid_vout] }).assign({
          rank: rank,
          pubkey: pubkey,
          extAddress: extra.extAddress,
          extP2P: extra.extP2P,
          extKey: extra.extKey,
        });
      }
    );

    return df.to_json({ orient: "index" });
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    // Consider handling the error more gracefully or rethrowing for the caller to handle
    throw error; // Rethrow if you want calling code to handle the exception
  }
};

export const getSnDataFromPastelidFunc = async (specifiedPastelid) => {
  try {
    const supernodeListJson = await checkSupernodeListFunc();
    const supernodeListDf = new DataFrame(JSON.parse(supernodeListJson));

    const filteredDf = supernodeListDf.query((df) =>
      df["extKey"].eq(specifiedPastelid)
    );

    if (filteredDf.shape[0] === 0) {
      logger.error("Specified machine is not a supernode!");
      return new DataFrame();
    } else {
      return filteredDf;
    }
  } catch (error) {
    logger.error(`An error occurred while fetching supernode data: ${error}`);
    throw error; // Rethrow the error for further handling if necessary.
  }
};

export const getSnDataFromSnPubkeyFunc = async (specifiedSnPubkey) => {
  try {
    const supernodeListJson = await checkSupernodeListFunc();
    const supernodeListDf = new DataFrame(JSON.parse(supernodeListJson));

    const filteredDf = supernodeListDf.query((df) =>
      df["pubkey"].eq(specifiedSnPubkey)
    );

    if (filteredDf.shape[0] === 0) {
      logger.error("Specified machine is not a supernode!");
      return new DataFrame();
    } else {
      return filteredDf;
    }
  } catch (error) {
    logger.error(`An error occurred while fetching supernode data: ${error}`);
    throw error; // Rethrow the error for further handling if necessary.
  }
};

export const checkIfTransparentPslAddressIsValidFunc = (
  pastelAddressString
) => {
  if (
    pastelAddressString.length === 35 &&
    pastelAddressString.startsWith("Pt")
  ) {
    return 1;
  } else {
    return 0;
  }
};

export const checkIfTransparentLspAddressIsValidFunc = (
  pastelAddressString
) => {
  if (
    pastelAddressString.length === 35 &&
    pastelAddressString.startsWith("tP")
  ) {
    return 1;
  } else {
    return 0;
  }
};

export const getDfJsonFromTicketsListRpcResponseFunc = async (rpcResponse) => {
  const tickets = rpcResponse.map((ticket) => ({
    ...ticket.ticket,
    txid: ticket.txid,
    height: ticket.height,
  }));

  const ticketsDf = new DataFrame(tickets);
  const ticketsDfJson = ticketsDf.to_json({ orient: "index" });
  return ticketsDfJson;
};

export const getPastelBlockchainTicketFunc = async (txid) => {
  const responseJson = await rpcConnection.call("tickets", "get", txid);
  if (Object.keys(responseJson).length > 0) {
    const ticketTypeString = responseJson.ticket.type;
    const correspondingRegTicketBlockHeight = responseJson.height;
    const latestBlockHeight = await getCurrentPastelBlockHeight();

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

    const correspondingRegTicketBlockInfo = await rpcConnection.call(
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
        activationResponseJson = await rpcConnection.call(
          "tickets",
          "find",
          "act",
          txid
        );
        break;
      case "action-reg":
        activationResponseJson = await rpcConnection.call(
          "tickets",
          "find",
          "action-act",
          txid
        );
        break;
      case "collection-reg":
        activationResponseJson = await rpcConnection.call(
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
};

export const getAllPastelBlockchainTicketsFunc = async (verbose = 0) => {
  if (verbose) {
    logger.info("Now retrieving all Pastel blockchain tickets...");
  }

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
  ]; // 'collection', 'collection-act' omitted for brevity

  for (const currentTicketType of listOfTicketTypes) {
    if (verbose) {
      logger.info(`Getting ${currentTicketType} tickets...`);
    }
    const response = await rpcConnection.call(
      "tickets",
      "list",
      currentTicketType
    );
    if (response && response.length > 0) {
      ticketsObj[currentTicketType] =
        await getDfJsonFromTicketsListRpcResponseFunc(response); // Assumes this function is already implemented
    }
  }

  return ticketsObj;
};

export const getUsernamesFromPastelIdFunc = async (pastelId) => {
  const response = await rpcConnection.call("tickets", "list", "username");
  const listOfReturnedUsernames = response
    .filter((ticket) => ticket.ticket.pastelID === pastelId)
    .map((ticket) => ticket.ticket.username);

  if (listOfReturnedUsernames.length > 0) {
    return listOfReturnedUsernames.length === 1
      ? listOfReturnedUsernames[0]
      : listOfReturnedUsernames;
  } else {
    return "Error! No username found for this pastelid";
  }
};

export const getPastelIdFromUsernameFunc = async (username) => {
  const response = await rpcConnection.call("tickets", "list", "username");
  const matchingTicket = response.find(
    (ticket) => ticket.ticket.username === username
  );

  return matchingTicket
    ? matchingTicket.ticket.pastelID
    : "Error! No pastelid found for this username";
};

export const testnetPastelIdFileDispenserFunc = async (
  password,
  verbose = 0
) => {
  if (verbose) logger.info("Now generating a pastelid...");
  const response = await rpcConnection.call("pastelid", "newkey", password);

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
      pastelIdData = ""; // Ensure pastelIdData is empty if file does not exist or error occurs
    }
  } else {
    logger.error("There was an issue creating the pastelid!");
  }

  return { pastelIdPubKey, pastelIdData: pastelIdData.toString("base64") };
};

export const getAllRegistrationTicketTxidsCorrespondingToACollectionTicketTxidFunc =
  async (collectionTicketTxid) => {
    try {
      const ticketDict =
        await getPastelBlockchainTicketFunc(collectionTicketTxid);
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
          responseJson = await rpcConnection.call(
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
              responseJson = await rpcConnection.call(
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
  };
