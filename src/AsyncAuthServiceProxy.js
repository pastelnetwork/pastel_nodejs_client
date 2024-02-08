import axios from "axios";
import { URL } from "url";
import logger from "./logger.js";

class JSONRPCException extends Error {
  constructor(rpc_error) {
    super(rpc_error.message);
    this.code = rpc_error.code;
    this.message = rpc_error.message;
    this.data = rpc_error.data; // Include additional data if available
    logger.error(`JSONRPC Error: ${this.code} - ${this.message}`);
  }
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
    this.reconnectTimeout = reconnectTimeout;
    this.reconnectAmount = reconnectAmount;
    this.requestTimeout = requestTimeout;
    this.idCount = 0;
    // Extract username and password from the URL to include in the Authorization header
    const url = new URL(serviceUrl);
    this.authHeader = `Basic ${Buffer.from(`${url.username}:${url.password}`).toString("base64")}`;
    // Remove credentials from the URL to prevent double authentication
    this.postUrl = serviceUrl.replace(`${url.username}:${url.password}@`, "");
  }

  async call(method, ...params) {
    const postData = JSON.stringify({
      jsonrpc: "1.0",
      id: ++this.idCount,
      method: this.serviceName ? `${this.serviceName}.${method}` : method,
      params: params,
    });

    const headers = {
      Authorization: this.authHeader,
      "Content-Type": "application/json",
    };

    for (let i = 0; i <= this.reconnectAmount; i++) {
      try {
        const response = await axios.post(this.postUrl, postData, {
          headers: headers,
          timeout: this.requestTimeout * 1000,
        });
        if (response.data.error)
          throw new JSONRPCException(response.data.error);
        return response.data.result;
      } catch (error) {
        if (i < this.reconnectAmount) {
          logger.info(
            `Reconnect attempt #${i + 1} failed, retrying in ${this.reconnectTimeout} seconds.`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, this.reconnectTimeout * 1000)
          );
        } else {
          logger.error("Reconnect attempts exceeded, operation failed.");
          throw error;
        }
      }
    }
  }
}

export default AsyncAuthServiceProxy;
