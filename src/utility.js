import crypto from "crypto";
import dns from "dns/promises";
import { exec, execSync } from "child_process";
import { promisify } from "util";
import logger from "./logger.js";
import { PastelBlockchainOperations } from "./blockchainOperations.js"; // Adjust import path as needed

const execAsync = promisify(exec);

class MyTimer {
  constructor() {
    this.start = Date.now();
  }

  stop() {
    const end = Date.now();
    const runtime = (end - this.start) / 1000; // Convert to seconds
    logger.info(`(${runtime.toFixed(2)} seconds to complete)`);
  }
}

const computeElapsedTimeInMinutesBetweenTwoDatetimes = (
  startDateTime,
  endDateTime
) => {
  const timeDelta = endDateTime - startDateTime; // in milliseconds
  const totalMinutesElapsed = timeDelta / 1000 / 60;
  return totalMinutesElapsed;
};

const computeElapsedTimeInMinutesSinceStartDateTime = (startDateTime) => {
  const endDateTime = new Date();
  return computeElapsedTimeInMinutesBetweenTwoDatetimes(
    startDateTime,
    endDateTime
  );
};

const getSha256HashOfInputData = (inputData) => {
  return crypto.createHash("sha256").update(inputData).digest("hex");
};

const checkIfIpAddressIsValid = async (ipAddressString) => {
  try {
    await dns.lookup(ipAddressString);
    return 1;
  } catch (error) {
    logger.error("Validation Error: " + error.message);
    return 0;
  }
};

const getExternalIp = async () => {
  try {
    const { stdout } = await execAsync("curl ifconfig.me");
    return stdout.trim();
  } catch (error) {
    logger.error(`Error fetching external IP: ${error.message}`);
    return "";
  }
};

const checkIfPasteldIsRunningCorrectlyAndRelaunchIfRequired = async () => {
  try {
    const currentPastelBlockHeightAndHash =
      await PastelBlockchainOperations.getCurrentPastelBlockHeightAndHash();
    const currentPastelBlockNumber =
      currentPastelBlockHeightAndHash.bestBlockHeight;
    if (
      typeof currentPastelBlockNumber === "number" &&
      currentPastelBlockNumber > 100000
    ) {
      logger.info("Pasteld is running correctly!");
      return 1;
    } else {
      logger.info("Pasteld was not running correctly, trying to restart it...");
      const { stdout } = await execAsync(
        "cd /home/pastelup/ && tmux new -d ./pastelup start walletnode --development-mode"
      );
      logger.info("Pasteld restart command output: " + stdout.trim());
      return 0;
    }
  } catch (error) {
    logger.error(`Problem running pastel-cli command: ${error}`);
    return 0;
  }
};

const installPasteld = async (networkName = "testnet") => {
  const installCommand = `mkdir ~/pastelup && cd ~/pastelup && wget https://github.com/pastelnetwork/pastelup/releases/download/v2.1.0/pastelup-linux-amd64 && mv pastelup-linux-amd64 pastelup && chmod 755 pastelup`;
  const commandString = `cd ~/pastelup && ./pastelup install walletnode -n=${networkName} --force -r=latest -p=18.118.218.206,18.116.26.219 && sed -i -e '/hostname/s/localhost/0.0.0.0/' ~/.pastel/walletnode.yml && sed -i -e '$arpcbind=0.0.0.0' ~/.pastel/pastel.conf && sed -i -e '$arpcallowip=172.0.0.0/8' ~/.pastel/pastel.conf && sed -i -e 's/rpcuser=.*/rpcuser=rpc_user/' ~/.pastel/pastel.conf && sed -i -e 's/rpcpassword=.*/rpcpassword=rpc_pwd/' ~/.pastel/pastel.conf`;

  try {
    if (execSync("test -d ~/pastelup/pastelup").toString()) {
      logger.info("Pastelup is already installed!");
      const commandResult = await execAsync(commandString);
      logger.info(
        "Pastelup install command output: " + commandResult.stdout.trim()
      );
    } else {
      logger.info("Pastelup is not installed, trying to install it...");
      await execAsync(installCommand);
      const commandResult = await execAsync(commandString);
      logger.info(
        "Pastelup install command output: " + commandResult.stdout.trim()
      );
    }
  } catch (error) {
    logger.error(`Error executing pastelup command: ${error.message}`);
  }
};

export {
  MyTimer,
  computeElapsedTimeInMinutesBetweenTwoDatetimes,
  computeElapsedTimeInMinutesSinceStartDateTime,
  getSha256HashOfInputData,
  checkIfIpAddressIsValid,
  getExternalIp,
  checkIfPasteldIsRunningCorrectlyAndRelaunchIfRequired,
  installPasteld,
};
