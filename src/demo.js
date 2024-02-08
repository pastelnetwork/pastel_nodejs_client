import { PastelBlockchainOperations } from "./index.js";

async function runDemo() {
  const blockchainOps = new PastelBlockchainOperations();
  await blockchainOps.initialize(); // Ensure initialization

  try {
    const currentPastelBlockHeightAndHash =
      await blockchainOps.getCurrentPastelBlockHeightAndHash();
    console.log(
      `Current Pastel Block Height and Hash: ${JSON.stringify(currentPastelBlockHeightAndHash)}`
    );

    const pastelid =
      "jXZ6VsP7LkNJE7oSrNRbvYfUHVLFySKeGyDUrTign84UURDohKDXcr49cRRG7fw8gjRxbtLL8ReGHgjfmv7z9y";
    const messageToSign = "my_message_1__hello_friends";
    const signature =
      "tQJHTrF5f7mPHYNTrYOTA1n1R8W233WidMgm/8+F6lqxafPBP8sudRG1MI+6A/3tlHOHbUQtpy8AIksLKo8gFtLOHtUmx3A99GlLWhResR85NO4o3V452Vlc6RnMieCSNWrnKAmda3cg6EM8qHM32BkA";

    const verificationResult = await blockchainOps.verifyMessageWithPastelid(
      pastelid,
      messageToSign,
      signature
    );
    console.log(`Verification Result: ${verificationResult}`);

    const masternodeTop = await blockchainOps.checkMasternodeTop();
    console.log(`Masternode Top: ${JSON.stringify(masternodeTop)}`);
  } catch (error) {
    console.error(`An operation failed: ${error.message}`);
  }
}

// Conditionally run the demo based on an environment variable or other flag
if (process.env.RUN_DEMO) {
  runDemo();
}
