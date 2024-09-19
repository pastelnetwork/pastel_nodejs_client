import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import os from "os";

dotenv.config();

const NetworkMode = Object.freeze({
  MAINNET: "mainnet",
  TESTNET: "testnet",
  DEVNET: "devnet",
  REGTEST: "regtest",
  UNKNOWN: "unknown",
});

const DefaultRpcPorts = Object.freeze({
  [NetworkMode.MAINNET]: "9932",
  [NetworkMode.TESTNET]: "19932",
  [NetworkMode.DEVNET]: "29932",
  [NetworkMode.REGTEST]: "18232",
});

function getNetworkMode(configFileLines) {
  const networkModeMap = {
    'mainnet': NetworkMode.MAINNET,
    'testnet': NetworkMode.TESTNET,
    'devnet': NetworkMode.DEVNET,
    'regtest': NetworkMode.REGTEST,
  };

  for (const line of configFileLines) {
    const trimmedLine = line.trim();

    // Split the line into key and value at the first '=' character
    const [key, value] = trimmedLine.split("=").map((str) => str.trim());

    if (networkModeMap[key] && value === "1") {
      return networkModeMap[key];
    }
  }

  return NetworkMode.UNKNOWN;
}

const getRpcSettingsFromFile = async (
  directoryWithPastelConf = null
) => {
  // set default directory to ~/.pastel if not provided or passed as null
  if (!directoryWithPastelConf) {
    directoryWithPastelConf = path.join(os.homedir(), ".pastel");
  }
  else {
    if (directoryWithPastelConf.startsWith("~")) {
      directoryWithPastelConf = directoryWithPastelConf.replace("~", os.homedir());
    }
    directoryWithPastelConf = path.resolve(directoryWithPastelConf);
  }
  const configFile = path.join(directoryWithPastelConf, "pastel.conf");
  const data = await fs.readFile(configFile, "utf8");
  const lines = data.split("\n");

  let rpcHost = "127.0.0.1",
    rpcPort = "19932",
    rpcUser,
    rpcPassword,
    otherFlags = {};

  const networkMode = getNetworkMode(lines);
  if (networkMode !== NetworkMode.UNKNOWN) {
    rpcPort = DefaultRpcPorts[networkMode];
  }

  lines.forEach((line) => {
    if (line.startsWith("rpcport"))
      rpcPort = line.split("=")[1].trim();
    else if (line.startsWith("rpcuser"))
      rpcUser = line.split("=")[1].trim();
    else if (line.startsWith("rpcpassword"))
      rpcPassword = line.split("=")[1].trim();
    else if (!line.startsWith("rpchost") && line !== "") {
      const [key, value] = line.trim().split("=");
      otherFlags[key.trim()] = value.trim();
    }
  });

  return { rpcHost, rpcPort, rpcUser, rpcPassword, otherFlags };
};

const writeRpcSettingsToEnvFile = async (
  rpcHost,
  rpcPort,
  rpcUser,
  rpcPassword,
  otherFlags
) => {
  const envContent = [
    `RPC_HOST=${rpcHost}`,
    `RPC_PORT=${rpcPort}`,
    `RPC_USER=${rpcUser}`,
    `RPC_PASSWORD=${rpcPassword}`,
    ...Object.entries(otherFlags).map(([key, value]) => `${key}=${value}`),
  ].join("\n");
  await fs.writeFile(path.join(process.cwd(), ".env"), envContent);
};

export const getConfig = async (
  directoryWithPastelConf = null
) => {
  let rpcHost = process.env.RPC_HOST,
    rpcPort = process.env.RPC_PORT,
    rpcUser = process.env.RPC_USER,
    rpcPassword = process.env.RPC_PASSWORD;

  // If any of the critical RPC settings are missing, attempt to load from the local configuration file.
  if (!rpcHost || !rpcPort || !rpcUser || !rpcPassword) {
    console.log(
      "RPC settings not found in environment variables. Attempting to read from configuration file..."
    );
    const rpcSettings = await getRpcSettingsFromFile(directoryWithPastelConf);
    await writeRpcSettingsToEnvFile(
      rpcSettings.rpcHost,
      rpcSettings.rpcPort,
      rpcSettings.rpcUser,
      rpcSettings.rpcPassword,
      rpcSettings.otherFlags
    );
    console.log(
      "RPC settings have been written to .env file. Please restart the application."
    );
    process.exit(1); // Exit and suggest restarting the application to load the new .env settings
  }

  return { rpcHost, rpcPort, rpcUser, rpcPassword };
};
