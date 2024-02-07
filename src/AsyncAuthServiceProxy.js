import axios from "axios";
import { URL } from "url";
import logger from "./logger.js";
import { getConfig } from "./config.js"; // Adjusted import path as necessary
import Decimal from "decimal.js"; // Ensure Decimal is imported

class JSONRPCException extends Error {
  constructor(rpc_error) {
    super(rpc_error.message);
    this.code = rpc_error.code;
    this.message = rpc_error.message;
    logger.error(`Error occurred in JSONRPCException: ${this.message}`);
  }
}

// Function to encode Decimal instances for JSON serialization
function encodeForJson(key, value) {
  if (value instanceof Decimal) {
    return value.toString(); // Convert Decimal instances to strings
  }
  return value;
}

class AsyncAuthServiceProxy {
  constructor(
    serviceUrl,
    serviceName = null,
    reconnectTimeout = 15,
    reconnectAmount = 2,
    requestTimeout = 20
  ) {
    this.serviceUrl = serviceUrl;
    this.serviceName = serviceName;
    this.url = new URL(serviceUrl);
    this.authHeader = `Basic ${Buffer.from(`${this.url.username}:${this.url.password}`).toString("base64")}`;
    this.reconnectTimeout = reconnectTimeout;
    this.reconnectAmount = reconnectAmount;
    this.requestTimeout = requestTimeout;
    this.idCount = 0;
  }

  async call(method, ...params) {
    // Serialize parameters, handling Decimal conversion
    const serializedParams = params;
    const postData = JSON.stringify(
      {
        version: "1.1",
        method: this.serviceName ? `${this.serviceName}.${method}` : method,
        params: serializedParams,
        id: ++this.idCount,
      },
      encodeForJson
    ); // Apply the custom serialization function

    const headers = {
      Authorization: this.authHeader,
      "Content-type": "application/json",
    };

    for (let i = 0; i <= this.reconnectAmount; i++) {
      try {
        const response = await axios.post(this.serviceUrl, postData, {
          headers: headers,
          timeout: this.requestTimeout * 1000,
        });
        if (response.data.error)
          throw new JSONRPCException(response.data.error);
        return response.data.result;
      } catch (error) {
        if (i < this.reconnectAmount) {
          const sleepTime = this.reconnectTimeout * Math.pow(2, i);
          logger.info(
            `Reconnect attempt #${i + 1} failed, waiting for ${sleepTime} seconds before retrying.`
          );
          await new Promise((resolve) => setTimeout(resolve, sleepTime * 1000));
        } else {
          logger.error("Reconnect attempts exceeded, operation failed.");
          throw error;
        }
      }
    }
  }
}

export const createRpcConnection = async () => {
  const { rpcHost, rpcPort, rpcUser, rpcPassword } = await getConfig();
  const serviceUrl = `http://${rpcUser}:${rpcPassword}@${rpcHost}:${rpcPort}`;
  return new AsyncAuthServiceProxy(serviceUrl);
};
