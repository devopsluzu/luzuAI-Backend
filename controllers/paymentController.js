const Razorpay = require('razorpay');
const nodemailer = require('nodemailer');
const axios = require('axios');
const crypto=require('crypto')

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY, GMAIL_USER, GMAIL_PASS } = process.env;




const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
});

const PLAN_IDS = {
    starter: "plan_Pwgwil3tpgT5XH", // Replace with actual Razorpay plan ID`
    pro: "plan_Pwgxw7kkB8YAeJ"         // Replace with actual Razorpay plan ID
};
console.log(PLAN_IDS);




const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Replace with your SMTP host
    port: 465, // Common port for SMTP with STARTTLS
    secure: true, // Set to true for port 465 (SSL), or false for port 587 (STARTTLS)
    auth: {
        user: 'in.trafyai@gmail.com', // Your custom email address
        pass: 'fjll iktm fyuc bzec' // Your email password
    }
});
// console.log('Razorpay Key:', process.env.RAZORPAY_ID_KEY);


// const createOrder = async (req, res) => {
//     try {
//         const { amount, name, description, currency } = req.body;

//         if (!amount || !currency) {
//             return res.status(400).json({ success: false, msg: 'Amount and currency are required' });
//         }

//         const options = {
//             amount: amount, // Amount already in paise from frontend
//             currency: currency, // Currency is set dynamically
//             receipt: `${Math.floor(Math.random() * 1000000)}`, // Unique receipt ID
//             payment_capture: 1, // Auto-capture payments
//         };

//         razorpayInstance.orders.create(options, (err, order) => {
//             if (!err) {
//                 res.status(200).json({
//                     success: true,
//                     order_id: order.id,
//                     amount: amount / 100, // Amount in INR
//                     key_id: RAZORPAY_ID_KEY,
//                     product_name: name,
//                     description: description,
//                     currency: currency,
//                 });
//             } else {
//                 console.error('Error creating order:', err);
//                 res.status(400).json({ success: false, msg: 'Something went wrong!' });
//             }
//         });
//     } catch (error) {
//         console.error('Server Error:', error.message);
//         res.status(500).json({ success: false, msg: 'Server error' });
//     }
// };



// const sendEmailNotification = async (email, subject, message) => {
//     try {
//         await transporter.sendMail({
//             from: "in.trafyai@gmail.com",
//             to: email,
//             subject: subject,
//             text: message
//         });
//         // console.log('Email sent successfully');
//     } catch (error) {
//         console.error('Error sending email:', error);
//     }
// };

// // Controller function to handle sending email after payment
// const sendPaymentEmail = async (req, res) => {
//     try {
//         const { email, paymentStatus } = req.body;
        

//         let subject, message;

//         if (paymentStatus === 'success') {
//             subject = 'Payment Successful';
//             message = 'Payment is collected. Thanks for submitting the form, we will reach out to you soon.';
//         } else {
//             subject = 'Payment Failed';
//             message = 'Unfortunately, the payment failed. Please try again.';
//         }

//         // Send the email
//         await sendEmailNotification(email, subject, message);

//         res.status(200).json({ success: true, msg: 'Email sent successfully' });
//     } catch (error) {
//         console.error('Error sending email:', error);
//         res.status(500).json({ success: false, msg: 'Failed to send email' });
//     }
// };


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
        const response = await razorpayInstance.subscriptions.cancel(subscriptionId);
        res.json(response);
    } catch (error) {
        console.error("Error cancelling subscription:", error);
        res.status(500).json({ success: false, msg: "Failed to cancel subscription" });
    }
};



module.exports = {
    // createOrder,
    // sendPaymentEmail,
    createPlan,
    createSubscription,
    handleWebhook,
    cancelSubscription,
    verifySubscription
};
