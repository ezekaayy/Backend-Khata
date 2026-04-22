const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controllers/account.controller")

const router = express.Router();

/**
 * - POST/api/accounts/
 * - Create  new account
 * - Protected Route
  */
router.post("/", authMiddleware.authMiddleware, accountController.createAccountController);

/** 
 * - GET/api/accounts/
 * - Get all accounts
 * - Protected Route
  */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController);

/**
 * - GET /api/accounts/balance/:accountId
 * - Get account balance
 * - Protected Route
 */
// router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController);


module.exports = router;