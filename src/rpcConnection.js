// rpcConnection.js

import { getConfig } from "./config.js";
import AsyncAuthServiceProxy from "./AsyncAuthServiceProxy.js";

let instance = null;

export const getRpcConnection = async () => {
  if (!instance) {
    const { rpcHost, rpcPort, rpcUser, rpcPassword } = await getConfig();
    const serviceUrl = `http://${rpcUser}:${rpcPassword}@${rpcHost}:${rpcPort}`;
    instance = new AsyncAuthServiceProxy(serviceUrl);
  }
  return instance;
};
