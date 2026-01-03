const Transaction = require("../Models/Transaction");
const notifyUser = require("../Utils/notifyUser");
const crypto = require("crypto");
const Account = require("../Models/Account");

const generateRefId = () =>
  "TXN-" + crypto.randomBytes(6).toString("hex").toUpperCase();

exports.payViaQR = async (req, res) => {
  try {
    const { fromAccount, toAccount, amount } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (fromAccount === toAccount) {
      return res.status(400).json({ message: "Cannot pay to same account" });
    }

    const sender = await Account.findOne({
      accountNumber: fromAccount,
      userId: req.user.id,
      status: "ACTIVE",
    });

    const receiver = await Account.findOne({
      accountNumber: toAccount,
      status: "ACTIVE",
    });

    if (!sender || !receiver) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    await Transaction.create({
      referenceId: generateRefId(),
      fromAccount,
      toAccount,
      amount,
      type: "TRANSFER",
      initiatedBy: "USER",
      balanceAfterTransaction: sender.balance,
      description: "QR Payment",
    });

    await notifyUser({
      userId: sender.userId,
      title: "QR Payment Sent",
      message: `₹${amount} paid via QR`,
    });

    await notifyUser({
      userId: receiver.userId,
      title: "QR Payment Received",
      message: `₹${amount} received via QR`,
    });

    res.json({ message: "QR payment successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getMyQRCode = async (req, res) => {
  try {
    const account = await Account.findOne({
      userId: req.user.id,
      status: "ACTIVE",
    });

    if (!account) {
      return res.status(404).json({ message: "Active account not found" });
    }

    const qrPayload = {
      accountNumber: account.accountNumber,
      name: req.user.id, // or fetch user name
      bank: "E-Banking",
    };

    res.json({
      qrData: qrPayload,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

