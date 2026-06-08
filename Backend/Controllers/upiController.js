const UpiProfile = require("../Models/UpiProfile");
const UpiRequest = require("../Models/UpiRequest");
const Account = require("../Models/Account");
const Transaction = require("../Models/Transaction");
const crypto = require("crypto");

// Create UPI ID for account string username@ebank
exports.createUpiId = async (req, res) => {
    try {
        const { username, accountNumber } = req.body;
        const account = await Account.findOne({ accountNumber, userId: req.user.id });
        if (!account) return res.status(404).json({ message: "Account not found or not yours" });
        
        const upiId = `${username}@ebank`.toLowerCase();
        
        const existing = await UpiProfile.findOne({ upiId });
        if (existing) return res.status(400).json({ message: "UPI ID already taken" });

        const profile = await UpiProfile.create({
            upiId,
            userId: req.user.id,
            accountNumber
        });

        res.status(201).json({ success: true, profile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Direct Scan & Pay
exports.scanAndPay = async (req, res) => {
    try {
        const { toUpiId, amount, fromAccount } = req.body;
        const receiverProfile = await UpiProfile.findOne({ upiId: toUpiId });
        if (!receiverProfile) return res.status(404).json({ message: "Receiver UPI ID not found" });

        const senderAcc = await Account.findOne({ accountNumber: fromAccount, userId: req.user.id });
        if (!senderAcc) return res.status(404).json({ message: "Sender account not found" });
        if (senderAcc.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

        const receiverAcc = await Account.findOne({ accountNumber: receiverProfile.accountNumber });

        senderAcc.balance -= amount;
        receiverAcc.balance += amount;
        await senderAcc.save();
        await receiverAcc.save();

        const transactionId = "TXN-" + crypto.randomBytes(6).toString("hex").toUpperCase();
        const txn = await Transaction.create({
           referenceId: transactionId,
           fromAccount: senderAcc.accountNumber,
           toAccount: receiverAcc.accountNumber,
           amount,
           type: "TRANSFER",
           initiatedBy: "USER",
           balanceAfterTransaction: senderAcc.balance,
           description: `UPI Payment to ${toUpiId}`
        });

        res.json({ success: true, transaction: txn });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a Collect Request
exports.createCollectRequest = async (req, res) => {
    try {
        const { payerUpiId, amount, description } = req.body;

        const requesterProfile = await UpiProfile.findOne({ userId: req.user.id });
        if (!requesterProfile) return res.status(404).json({ message: "You don't have a UPI ID" });

        const request = await UpiRequest.create({
            requestId: "req_" + crypto.randomBytes(6).toString("hex"),
            requesterUpiId: requesterProfile.upiId,
            payerUpiId,
            amount,
            description
        });

        res.status(201).json({ success: true, request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPendingRequests = async (req, res) => {
    try {
       const profile = await UpiProfile.findOne({ userId: req.user.id });
       if (!profile) return res.json({ requests: [] });

       const requests = await UpiRequest.find({ payerUpiId: profile.upiId, status: "PENDING" });
       res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.approveCollectRequest = async (req, res) => {
    try {
        const { requestId, fromAccount } = req.body;
        const request = await UpiRequest.findOne({ requestId, status: "PENDING" });
        if (!request) return res.status(404).json({ message: "Request not found" });

        const payerProfile = await UpiProfile.findOne({ upiId: request.payerUpiId, userId: req.user.id });
        if (!payerProfile) return res.status(403).json({ message: "Not your request to approve" });

        const requesterProfile = await UpiProfile.findOne({ upiId: request.requesterUpiId });
        
        const senderAcc = await Account.findOne({ accountNumber: fromAccount || payerProfile.accountNumber, userId: req.user.id });
        if (senderAcc.balance < request.amount) return res.status(400).json({ message: "Insufficient balance" });

        const receiverAcc = await Account.findOne({ accountNumber: requesterProfile.accountNumber });

        senderAcc.balance -= request.amount;
        receiverAcc.balance += request.amount;
        await senderAcc.save();
        await receiverAcc.save();

        const transactionId = "TXN-" + crypto.randomBytes(6).toString("hex").toUpperCase();
        await Transaction.create({
           referenceId: transactionId,
           fromAccount: senderAcc.accountNumber,
           toAccount: receiverAcc.accountNumber,
           amount: request.amount,
           type: "TRANSFER",
           initiatedBy: "USER",
           balanceAfterTransaction: senderAcc.balance,
           description: `UPI Collect Approval to ${request.requesterUpiId}`
        });

        request.status = "APPROVED";
        await request.save();

        res.json({ success: true, request });
    } catch (error) {
       res.status(500).json({ message: error.message });
    }
};
