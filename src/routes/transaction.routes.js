const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controler");
const transactionRoutes = Router();


/** 
 * POST /api/transaction/create
 * @description Create a new transaction
 */

transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction);

/** 
 * POST /api/transaction/system/initial-finds
 * @description Create initial funds for system user
 */

transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction);

module.exports = transactionRoutes;