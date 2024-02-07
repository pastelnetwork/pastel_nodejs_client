import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import os from "os";

dotenv.config();

const getRpcSettingsFromFile = async (
  directoryWithPastelConf = path.join(os.homedir(), ".pastel")
) => {
  const configFile = path.join(directoryWithPastelConf, "pastel.conf");
  const data = await fs.readFile(configFile, "utf8");
  const lines = data.split("\n");
  let rpcHost = "127.0.0.1",
    rpcPort = "19932",
    rpcUser,
    rpcPassword,
    otherFlags = {};

  lines.forEach((line) => {
    if (line.startsWith("rpcport")) rpcPort = line.split("=")[1].trim();
    else if (line.startsWith("rpcuser")) rpcUser = line.split("=")[1].trim();
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

export const getConfig = async () => {
  let rpcHost = process.env.RPC_HOST,
    rpcPort = process.env.RPC_PORT,
    rpcUser = process.env.RPC_USER,
    rpcPassword = process.env.RPC_PASSWORD;

  // If any of the critical RPC settings are missing, attempt to load from the local configuration file.
  if (!rpcHost || !rpcPort || !rpcUser || !rpcPassword) {
    console.log(
      "RPC settings not found in environment variables. Attempting to read from configuration file..."
    );
    const rpcSettings = await getRpcSettingsFromFile();
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
