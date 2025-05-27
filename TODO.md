Deploy on Digital Ociean Droplet:
  Temporary domain
    jardindeschefs.lucienfradet.xyz
    wordpress.lucienfradet.xyz

Checkout process:
  ✅ User buys a product → Sent to Stripe Checkout
  ✅ Stripe processes payment → Calls Next.js webhook
  ✅ Webhook creates an order in WooCommerce via REST API
    Step 2: Add the Webhook to Stripe Dashboard
    Go to Stripe Webhooks.
    Click "Add Endpoint."
    Set the URL to:
    arduino
    Copy
    Edit
    https://yourwebsite.com/api/stripe-webhook
    Select checkout.session.completed as the event type.
    Copy the signing secret and set it as STRIPE_WEBHOOK_SECRET in your .env file.
  ✅ WooCommerce tracks the sale and can send email confirmations


Email:
  Steps to Set Up SMTP for WordPress
  Install an SMTP Plugin

  Go to WordPress Admin > Plugins > Add New
  Search for and install WP Mail SMTP (by WPForms)
  Choose an SMTP Provider

  You can use a third-party SMTP service like:
  Gmail SMTP (via App Password)
  Mailgun (free up to 5,000 emails/month)
  SendGrid (free up to 100 emails/day)
  Postmark, Amazon SES, or your domain provider’s SMTP
  Configure SMTP Settings in WP Mail SMTP

  SMTP Host: smtp.gmail.com (or your provider)
  SMTP Port: 465 (SSL) or 587 (TLS)
  Username: Your email address
  Password: App Password (for Gmail) or SMTP Password
  Test Email Sending

  Go to WP Mail SMTP > Email Test, send a test email, and check if it arrives.

(Or use Postfix?)

NEED TO DISABLE XML-RPC on wordpress and hardened its security!

Implement Cloudflare reverse proxy as security features

### First update after deployment:
- [x] Fix the a propos youtube link permissions
-[ ] Crapaudine ouvrir une seconde tab au lieu de changer de site completement
- [x] Enbale wordpress cron
- [ ] Fix the loading between booking, checkout, payment and booking to detail!
- [ ] Test large file upload
- [x] Fix the Header middleware files and test ounce deployed
