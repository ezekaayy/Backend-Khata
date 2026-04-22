const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

/** 
 * - Create a new transaction
 * THE 10 STEPS TRANSFER FLOW
 * 1. Validate request 
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction COMPLETED
 * 9. Commit MongoDB session
 * 10. Send email notification
  */


async function createTransaction(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    /** 
     * 1. Validate request
     */
    if (!fromAccount || !toAccount || amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount, toAccount, amount and idempotencyKey are required"
        });
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid formAccount or toAccount"
        })
    }



    /** 
     * 2. validate idempotency key
     * We can check if there is any transaction with same idempotency key and fromAccount. If yes, we can return the same response as previous request
     */

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey,
    })

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })

            if (isTransactionAlreadyExists.status == "PENDING") {
                return res.status(200).json({
                    message: "Transaction is still processsing",
                })
            }

            if (isTransactionAlreadyExists.status == "FAILED") {
                return res.status(500).json({
                    message: "Transaction failed",
                })
            }

            if (isTransactionAlreadyExists.status == "REVERSED") {
                return res.status(500).json({
                    message: "Transaction was reversed, please retry.",
                })
            }
        }
    }

    /** 
     * 3. Check account status
     */

    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be active to process the transaction"
        })
    }

    /** 
     * 4. Derive sender balance from ledger
     */
    const balance = await fromUserAccount.getBalance();

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Please top up your account to process the transaction.`
        })
    }


    /** 
     * 5. Create transaction (PENDING)
     */

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const transaction = await transactionModel.create({
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }, { session });

        

        /** 
         * 6. Create DEBIT ledger entry
         */
        const debitLedgerEntry = await ledgerModel.create({
            account: fromAccount,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        }, { session });

        /** 
         * 7. Create CREDIT ledger entry
         */
        const creditLedgerEntry = await ledgerModel.create({
            account: toAccount,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }, { session });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        // emailService.sendEmail({
        //     to: toUserAccount.user.email,
        //     subject: "Funds Credited",
        //     text: `Your account has been credited with ${amount} ${toUserAccount.currency}.`
        // })
        await emailService.sendTransactionEmail({
            userEmail: req.user.email,
            name: req.user.name,
            amount,
            toAccount: toUserAccount._id
        });

        return res.status(201).json({
            message: "Transaction created successfully",
            transaction: transaction
        });


    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            message: "An error occurred while processing the transaction",
            error: error.message
        })
    }
    
}





async function createInitialFundsTransaction(req, res) {
    if (!req.body) {
        return res.status(400).json({
            message: "Request body is missing. Please ensure Content-Type is set to application/json."
        });
    }
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        });
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    // from account will be system account, we can get it by finding account with systemUser true and currency same as toAccount currency
    const fromUserAccount = await accountModel.findOne({
        // systemUser: true,
        user: req.user._id,
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System account not found for the user"
        })
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount: toUserAccount._id,
        amount,
        idempotencyKey,
        status: "PENDING"
    });

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session });

    const creditLedgerEntry = await ledgerModel.create([{
        account: toUserAccount._id,
        amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], { session });

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    // emailService.sendEmail({
    //     to: toUserAccount.user.email,
    //     subject: "Initial Funds Credited",
    //     text: `Your account has been credited with ${amount} ${toUserAccount.currency} as initial funds.`
    // })

    return res.status(201).json({
        message: "Initial funds transaction created successfully",
        transaction: transaction
    });
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}