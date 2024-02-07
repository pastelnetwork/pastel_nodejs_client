// Import adjusted to the new async getConfig
import { getConfig } from "./config.js";
import { AsyncAuthServiceProxy } from "./AsyncAuthServiceProxy.js";

export const createRpcConnection = async () => {
  const { rpcHost, rpcPort, rpcUser, rpcPassword } = await getConfig();
  const serviceUrl = `http://${rpcUser}:${rpcPassword}@${rpcHost}:${rpcPort}`;
  return new AsyncAuthServiceProxy(serviceUrl);
};
