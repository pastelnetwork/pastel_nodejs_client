// rpcConnection.js

import { getConfig } from "./config.js";
import AsyncAuthServiceProxy from "./AsyncAuthServiceProxy.js";

let instance = null;

export const getRpcConnection = async (
  directoryWithPastelConf = null
) => {
  if (!instance) {
    const { rpcHost, rpcPort, rpcUser, rpcPassword } = await getConfig(directoryWithPastelConf);
    const serviceUrl = `http://${rpcUser}:${rpcPassword}@${rpcHost}:${rpcPort}`;
    instance = new AsyncAuthServiceProxy(serviceUrl);
  }
  return instance;
};
