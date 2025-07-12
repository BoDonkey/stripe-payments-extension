# @bodonkey/stripe-payments-extension

A flexible Stripe payment integration module for ApostropheCMS that provides secure checkout functionality with customizable styling.

## Features

- 🚀 **Easy Integration**: Simple one-click checkout with Stripe
- 🎨 **Flexible Styling**: Works with any CSS framework or custom styles
- 🛡️ **Secure**: Uses Stripe's hosted checkout for PCI compliance
- 📱 **Responsive**: Mobile-friendly payment flows
- 🔧 **Configurable**: Customizable success/cancel pages
- 📊 **Developer Friendly**: Clean API and template helpers

## Installation

```bash
npm install @bodonkey/stripe-payments-extension
```

## Quick Setup

### 1. Add to your project

In your `app.js`, add the module:

```javascript
modules: {
  '@bodonkey/stripe-payment': {
    options: {
      // Your Stripe secret key (use environment variable)
      secretKey: process.env.STRIPE_SECRET_KEY,
      // Optional: currency (defaults to 'usd')
      currency: 'usd',
      // Optional: custom success/cancel URLs
      successUrl: '/checkout/success',
      cancelUrl: '/checkout/cancel'
    }
  }
}
```

### 2. Set environment variable

Create a `.env` file or set your environment variable:

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
```
> [!WARNING]
> Make sure if you create an `.env` file with your key to add it to your `.gitignore` file.

### 3. Add payment buttons to your templates

Use the provided template helpers in your product templates:

```nunjucks
<!-- Simple button (uses default styling) -->
{{ apos.stripePayment.button({
  productId: product._id,
  price: product.price,
  name: product.title,
  image: apos.attachment.url(product.image)
}) }}

<!-- Custom styled button -->
{{ apos.stripePayment.button({
  productId: product._id,
  price: product.price,
  name: product.title,
  image: apos.attachment.url(product.image),
  buttonText: 'Buy Now',
  class: 'my-custom-button-class',
  style: 'background: blue; color: white; padding: 10px;'
}) }}

<!-- Use different currency than default
-->
<button class="stripe-checkout-button btn btn-primary"
        data-product-id="{{ product._id }}"
        data-price="{{ product.price }}"
        data-name="{{ product.title }}"
        data-currency="jpy"
        data-image="{{ apos.attachment.url(product.image) }}">
  Buy for ¥{{ product.price }}
</button>

<!-- Using with existing button helpers (e.g., Tailwind/Bootstrap) -->
<button class="btn btn-primary stripe-checkout-button"
        data-product-id="{{ product._id }}"
        data-price="{{ product.price }}"
        data-name="{{ product.title }}"
        data-image="{{ apos.attachment.url(product.image) }}">
  Buy Now with Stripe
</button>
```

# Email Confirmation Setup

The Stripe Payment module can automatically send confirmation emails to customers after successful payments.

## Configuration

### Basic Setup

```javascript
// In your app.js
'@bodonkey/stripe-payment': {
  options: {
    email: {
      enabled: true,                      // Enable confirmation emails
      fromAddress: 'orders@yourstore.com', // Required: sender email
      fromName: 'Your Store Name',         // Sender name (optional)
      subject: 'Order Confirmation'        // Email subject (optional)
    }
  }
}
```

### Advanced Options

```javascript
email: {
  enabled: true,                           // Enable/disable emails
  fromAddress: 'orders@yourstore.com',     // Required: sender email
  fromName: 'Your Store Name',             // Friendly sender name
  ccToSender: true,                        // Send copy to sender email
  replyTo: 'support@yourstore.com',        // Reply-to address (optional)
  subject: 'Your Order Confirmation',      // Email subject line
  template: 'stripe-confirmation',         // Template name (default: 'stripe-confirmation')
  attachReceipt: false                     // Future: PDF receipt attachment
}
```

## Email Template

Create a template file at `views/emails/stripe-confirmation.html` in your project:

```html
<!-- See the email template example above -->
```

### Template Data Available

The email template receives the following data:

```javascript
{
  session: {/* Full Stripe session object */},
  order: {
    id: 'cs_...',           // Stripe session ID
    amount: 1999,           // Amount in cents
    currency: 'usd',        // Currency code
    status: 'paid',         // Payment status
    date: Date,             // Order date
    customer: {             // Customer details
      name: 'John Doe',
      email: 'john@example.com'
    }
  },
  site: {
    name: 'Your Store',     // Site name
    url: 'https://...'      // Base URL
  }
}
```

## Prerequisites

1. **ApostropheCMS Email Module**: Make sure you have `@apostrophecms/email` configured:

```javascript
'@apostrophecms/email': {
  options: {
    transport: {
      host: 'smtp.yourprovider.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  }
}
```

2. **Environment Variables** (if using SMTP):
```bash
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

## Email Providers

The module works with any email provider supported by ApostropheCMS:
- SMTP (Gmail, Outlook, custom servers)
- SendGrid
- Mailgun
- Amazon SES
- Postmark

## Testing

To test email functionality:

1. Enable emails in your configuration
2. Make a test payment
3. Check your email and the sender's email (if `ccToSender: true`)
4. Monitor the ApostropheCMS logs for email status

## Troubleshooting

- **Emails not sending**: Check that `@apostrophecms/email` is properly configured
- **Missing customer email**: Stripe Checkout will collect email automatically
- **Template errors**: Ensure your template file exists and has valid syntax
- **SMTP errors**: Verify your SMTP credentials and server settings

## Security Notes

- Never commit SMTP credentials to version control
- Use environment variables for sensitive configuration
- The `ccToSender` option sends a copy to your `fromAddress` - useful for order tracking
- Customer emails are only sent if Stripe provides a customer email address

## API Reference

### Template Helper: `apos.stripePayment.button(options)`

Creates a Stripe checkout button with the specified options.

**Options:**
- `productId` (required): Unique identifier for the product
- `price` (required): Price in dollars (e.g., 29.99)
- `name` (required): Product name to display in checkout
- `image` (optional): Product image URL
- `buttonText` (optional): Button text (default: "Buy Now")
- `class` (optional): CSS classes to add to the button
- `style` (optional): Inline CSS styles
- `disabled` (optional): Whether button should be disabled

### REST API Endpoints

- `POST /api/v1/@bodonkey/stripe-payment/create-checkout`: Creates a new checkout session
- `GET /checkout/success`: Success page (customizable)
- `GET /checkout/cancel`: Cancel page (customizable)

## Styling Guide

### Using with CSS Frameworks

**Tailwind CSS:**
```nunjucks
{{ apos.stripePayment.button({
  productId: product._id,
  price: product.price,
  name: product.title,
  class: 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
}) }}
```

**Bootstrap:**
```nunjucks
{{ apos.stripePayment.button({
  productId: product._id,
  price: product.price,
  name: product.title,
  class: 'btn btn-primary btn-lg'
}) }}
```

**Custom CSS:**
```css
.my-stripe-button {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.my-stripe-button:hover {
  transform: translateY(-2px);
}

.my-stripe-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

### Using with Existing Button Helpers

If you have existing button helpers (like in the e-commerce starter kit), you can use them:

```nunjucks
{# E-commerce starter kit example #}
{{ buttons.primary(
  'Buy Now with Stripe',
  {
    cls: 'stripe-checkout-button',
    data: {
      'product-id': product._id,
      'price': product.price,
      'name': product.title,
      'image': apos.attachment.url(product.image)
    }
  }
) }}
```

## Customization

### Custom Success/Cancel Pages

Create your own templates by extending the module:

```javascript
// In your project's modules/stripe-payment/index.js
export default {
  extend: '@apostrophecms/stripe-payment',
  // Override default templates
  // Your custom templates go in modules/stripe-payment/views/
}
```

### Configuration Options

```javascript
'@apostrophecms/stripe-payment': {
  options: {
    currency: 'eur', // Change currency
    acceptedCurrencies: [ 'usd', 'eur', 'gbp', 'jpy', 'mxn' ], // Limit accepted currencies
    currencyConfig: {
      mxn: { decimals: 2, min: 0.01, symbol: '$', label: 'Mexican Peso' }
    }, 
    // Add custom currencies
    collectShipping: true, // Collect shipping address
    collectPhone: true, // Collect phone number
    allowPromotionCodes: true, // Enable promo codes
    // Custom metadata
    metadata: {
      source: 'website'
    }
  }
}
```

## Testing

Use Stripe's test card numbers for development:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0000 0000 3220

## Production Deployment

When you're ready to go live:

1. **Get your live API keys** from the Stripe Dashboard
2. **Set the production environment variable**:
   ```bash
   export APOS_STRIPE_SECRET_KEY=sk_live_your_live_key_here
   ```
3. **Never commit API keys to version control**
4. **Test thoroughly** with small amounts before going live

### Security Best Practices

- ✅ **Always use environment variables** for API keys
- ✅ **Use test keys during development** (they start with `sk_test_`)
- ✅ **Use live keys only in production** (they start with `sk_live_`)
- ❌ **Never commit API keys** to your repository
- ❌ **Never expose API keys** in client-side code
- ✅ **Add `.env` to your `.gitignore`** file if using local env files

## Example Project Structure

```
my-project/
├── modules/
│   └── stripe-payment/          # Optional: for customizations
│       ├── index.js             # Extend the base module
│       └── views/
│           ├── success.html     # Custom success page
│           └── cancel.html      # Custom cancel page
├── app.js                       # Module configuration
└── .env                         # Environment variables
```

## Contributing

Issues and pull requests welcome at [GitHub repository URL]

## License

MIT