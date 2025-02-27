const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Payment routes
// router.post('/createOrder', paymentController.createOrder);
// router.post('/sendPaymentEmail', paymentController.sendPaymentEmail);

router.post('/sendSignInEmail', paymentController.sendSignInEmail);
router.post('/createSubscription', paymentController.createSubscription);
router.post('/cancelSubscription', paymentController.cancelSubscription);
router.post('/webhook', paymentController.handleWebhook);
router.post('/verifySubscription', paymentController.verifySubscription);




module.exports = router;
