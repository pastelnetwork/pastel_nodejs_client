// Assuming this code is in your src/index.js or any other module
import {
  getCurrentPastelBlockHeight,
  checkSupernodeListFunc,
} from "./blockchainOperations.js";
import logger from "./logger.js";

(async () => {
  try {
    const height = await getCurrentPastelBlockHeight();
    logger.info(`Current Pastel block height: ${height}`);
  } catch (error) {
    logger.error(
      `An error occurred while fetching the block height: ${error.message}`
    );
  }
})();

(async () => {
  try {
    const supernodeList = await checkSupernodeListFunc();
    console.log(supernodeList); // Log or process the supernode list JSON
  } catch (error) {
    console.error(`Failed to fetch supernode list: ${error}`);
  }
})();
