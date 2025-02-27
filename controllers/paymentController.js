const Razorpay = require('razorpay');
const axios = require('axios');
const crypto=require('crypto')

const nodemailer = require('nodemailer');

const admin = require('firebase-admin');
const { auth, firestore } = require('../utils/firebaseAdmin');

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY, GMAIL_USER, GMAIL_PASS } = process.env;

const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
});

const PLAN_IDS = {
    starter: "plan_PzS7ededkoHa39", // Replace with actual Razorpay plan ID`
    pro: "plan_PzS8iQnuLHe4Rq"         // Replace with actual Razorpay plan ID
};
console.log(PLAN_IDS);


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Replace with your SMTP host
  port: 465, // Common port for SMTP with STARTTLS
  secure: true, // Set to true for port 465 (SSL), or false for port 587 (STARTTLS)
  auth: {
      user: 'info@prfec.ai', // Your custom email address
      pass: 'zwap nfow xtiu fpiy' // Your email password
  }
});

const sendEmailNotification = async (email, subject, message) => {
  try {
      await transporter.sendMail({
          from: '"Your Project Team" <info@prfec.ai>',
          to: email,
          subject: subject,
          text: message
      });
      // console.log('Email sent successfully');
  } catch (error) {
      console.error('Error sending email:', error);
  }
};

// Controller function to handle sending email after payment
const sendSignInEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
      return res.status(400).json({ success: false, msg: 'Email is required' });
  }

  try {
      // Generate the email sign-in link using Firebase Admin SDK
      const actionCodeSettings = {
          url: `${process.env.FRONTEND_URL}/login?email=${encodeURIComponent(email)}`,
          handleCodeInApp: true,
      };
      const link = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);

      // URL of the logo
      const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/prfecai-auth.firebasestorage.app/o/Prfec%20Logo%20White.png?alt=media&token=99410079-cdfe-4d04-bc83-c488b3d26916';

      // Send custom sign-in email with Nodemailer
      const mailOptions = {
          from: 'Sign In <info@prfec.ai>',
          to: email,
          subject: 'Sign In to Your Account',
          html: `
          <html>
              <head>
                  <link href="https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">                   
                  <style>
                      body {
                          background-color: #f9f9f9;
                          margin: 0;
                          padding: 0;
                      }
                      .email-container {
                          width: 100%;
                          max-width: 600px;
                          margin: 0 auto;
                          padding: 20px;
                          background-color: #000000; /* Black background */
                          color: #ffffff; /* White text */
                          border-radius: 8px;
                          text-align: center;
                      }
                      .button {
                          background-color: #ffffff; /* White button background */
                          color: #000000; /* Black text on the button */
                          border: none;
                          border-radius: 8px;
                          padding: 12px 24px;
                          text-decoration: none;
                          font-size: 15px;
                          margin: 0;
                          display: inline-block;
                          font-weight: 500;
                          cursor: pointer;
                          font-family:"Inter",serif;
                      }
                      .email-container img {
                          margin: 20px auto; /* Center image */
                          max-width: 120px; /* Limit image size */
                          display: block; /* Ensure it's block-level for centering */
                          border: none; /* Remove default border */
                      }
                      h1{
                          margin-top:40px;
                          font-size:24px;
                          font-weight:600;
                          color:white;
                          font-family:"Inter",serif;

                          }
                      p {
                          margin-top:10px;
                          margin-bottom:40px;
                          font-size: 14px;
                          color:#d1d1d1;
                          font-family:"Inter",serif;

                      }
                  </style>
              </head>
              <body>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9f9f9; padding: 20px;">
                      <tr>
                          <td align="center">
                              <div class="email-container">
                                  <img src="${logoUrl}" alt="Logo">
                                  <h1>Let's get you signed in</h1>
                                  <p>All you have to do is click this button and we'll sign you in with a secure link</p>
                                  <a href="${link}" class="button" style="color:black;">Sign in to prfec</a>
                                  <p style="font-size:13px;color:#d1d1d1;font-weight:400;margin: 40px 0;">If you did not request this email, you can safely ignore it.</p>
                              </div>
                          </td>
                      </tr>
                  </table>
              </body>
          </html>
      `,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true, msg: 'Custom sign-in email sent successfully' });
  } catch (error) {
      console.error('Error in sendSignInEmail:', error);
      res.status(500).json({ success: false, msg: 'Failed to send sign-in email' });
  }
};


const createPlan = async () => {
    try {
        const planStarter = await razorpayInstance.plans.create({
            period: "monthly",
            interval: 1,
            item: {
                name: "Starter Plan",
                amount: 2000 * 100, // Razorpay amount in paise (20 USD) 
                currency: "USD"
            }
        });

        const planPro = await razorpayInstance.plans.create({
            period: "monthly",
            interval: 1,
            item: {
                name: "Pro Plan",
                amount: 4500 * 100, // Razorpay amount in paise (45 USD)
                currency: "USD"
            }
        });

        console.log("Starter Plan:", planStarter.id);
        console.log("Pro Plan:", planPro.id);
    } catch (error) {
        console.error("Error creating plan:", error);
    }
};

// Run this function once to create plans
// createPlan();

const createSubscription = async (req, res) => {
    try {
      const { planType, customerEmail, customerId } = req.body;
  
      if (!PLAN_IDS[planType]) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid plan type" 
        });
      }
  
      // Create a Razorpay subscription
      const subscription = await razorpayInstance.subscriptions.create({
        plan_id: PLAN_IDS[planType],
        customer_notify: 1,
        total_count: 12, // 12 monthly payments
        notes: {
          customer_email: customerEmail,
          customer_id: customerId,
          plan_type: planType
        }
      });
  
      res.status(200).json({
        success: true,
        subscription,
        key_id: process.env.RAZORPAY_ID_KEY
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({
        success: false,
        message: "Error creating subscription"
      });
    }
  };


  const verifySubscription = async (req, res) => {
    try {
      const {
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature
      } = req.body;
  
      // Generate signature for verification
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
        .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
        .digest('hex');
  
      if (generatedSignature === razorpay_signature) {
        res.json({
          success: true,
          message: "Payment verified successfully"
        });
      } else {
        res.json({
          success: false,
          message: "Payment verification failed"
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({
        success: false,
        message: "Error verifying payment"
      });
    }
  };


const handleWebhook = async (req, res) => {
  try {
    // Verify webhook signature
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (generatedSignature === webhookSignature) {
      const event = req.body.event;
      const payload = req.body.payload;

      switch (event) {
        case 'subscription.activated':
          await handleSubscriptionActivated(payload);
          break;
        case 'subscription.charged':
          await handleSubscriptionCharged(payload);
          break;
        case 'subscription.completed':
          await handleSubscriptionCompleted(payload);
          break;
        case 'subscription.cancelled':
          await handleSubscriptionCancelled(payload);
          break;
      }

      res.json({ success: true });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing webhook"
    });
  }
};



const cancelSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_ID_KEY,
          key_secret: process.env.RAZORPAY_SECRET_KEY,
        });

        console.log("RAZORPAY_ID_KEY:", process.env.RAZORPAY_ID_KEY);
console.log("RAZORPAY_SECRET_KEY:", process.env.RAZORPAY_SECRET_KEY);


        const cancellation = await razorpay.subscriptions.cancel(subscriptionId);

        if (!cancellation || cancellation.status !== 'cancelled') {
          return res.status(400).json({ success: false, message: 'Cancellation failed' });
        }
    
        res.json({ success: true, message: 'Subscription canceled successfully' });
      } catch (error) {
        console.error('Subscription cancellation error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
};



module.exports = {
    // createOrder,
    // sendPaymentEmail,
    createPlan,
    createSubscription,
    handleWebhook,
    cancelSubscription,
    verifySubscription,
    sendSignInEmail,
    sendEmailNotification
};
