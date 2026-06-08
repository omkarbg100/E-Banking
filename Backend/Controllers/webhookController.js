const Webhook = require("../Models/Webhook");

// Helper to fire webhooks
exports.fireWebhook = async (merchantId, event, data) => {
  try {
    const webhook = await Webhook.findOne({ merchantId, isActive: true });
    if (!webhook) return;

    const payload = JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString()
    });

    console.log(`Firing webhook for ${merchantId} to ${webhook.url} for event ${event}`);
    
    // We use Node's native fetch (available in Node 18+)
    await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": webhook.secret
      },
      body: payload
    });
  } catch (error) {
    console.error("Webhook firing failed:", error.message);
  }
};

// Route: Register Webhook
// Authenticated via standard dashboard auth -> user -> DeveloperAccount
exports.registerWebhook = async (req, res) => {
  try {
    const { url, secret } = req.body;
    
    // Get merchantId from DeveloperAccount associated with req.user.id
    const DeveloperAccount = require("../Models/DeveloperAccount");
    const devAccount = await DeveloperAccount.findOne({ userId: req.user.id });
    if (!devAccount) return res.status(404).json({ message: "Developer account not found" });

    let webhook = await Webhook.findOne({ merchantId: devAccount.merchantId });
    if (webhook) {
      webhook.url = url;
      webhook.secret = secret;
      await webhook.save();
    } else {
      webhook = await Webhook.create({
        merchantId: devAccount.merchantId,
        url,
        secret
      });
    }

    res.json({ success: true, webhook });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWebhook = async (req, res) => {
    try {
        const DeveloperAccount = require("../Models/DeveloperAccount");
        const devAccount = await DeveloperAccount.findOne({ userId: req.user.id });
        if (!devAccount) return res.status(404).json({ message: "Developer account not found" });
    
        let webhook = await Webhook.findOne({ merchantId: devAccount.merchantId });
        res.json({ success: true, webhook });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
};
