# @bodonkey/stripe-payments-extension

A complete Stripe payment integration for ApostropheCMS that provides secure checkout functionality with customizable styling and automatic email confirmations.

## 🚀 Features

- **🔒 Secure Payments**: PCI-compliant checkout using Stripe's hosted solution
- **🎨 Flexible Design**: Works with any CSS framework (Tailwind, Bootstrap, custom)
- **📧 Email Confirmations**: Automatic (optional) order confirmation emails to customers
- **🌍 Multi-Currency**: Support for 9 major currencies with proper formatting
- **📱 Mobile Responsive**: Optimized for all device sizes
- **🛠️ Developer Friendly**: Clean APIs, template helpers, and widget system
- **⚡ Easy Integration**: One-click checkout buttons via widgets or template helpers

## 📦 What's Included

This extension provides two complementary modules:

### Core Payment Module (`@bodonkey/stripe-payment`)
The foundation that handles Stripe integration, payment processing, success/cancel pages, and email confirmations. Use this if you want to build custom checkout flows.

### Button Widget (`@bodonkey/stripe-button-widget`)
An optional drag-and-drop widget for the ApostropheCMS admin interface that lets content editors easily add "Buy Now" buttons to any area without coding.

## 🛠️ Installation

### 1. Install the Package

```bash
npm install @bodonkey/stripe-payments-extension
```

### 2. Add Bundle and Modules to Your Project

Add both the bundle and the modules to your `app.js` configuration:

```javascript
const config = {
  root: import.meta,
  shortName: 'your-project-name',
  baseUrl: 'http://localhost:3000',
  bundles: [ '@bodonkey/stripe-payments-extension' ],
  modules: {
    '@bodonkey/stripe-payment': {},
    '@bodonkey/stripe-button-widget': {},
    // Your other modules...
  }
};
```

> **📝 Note**: Both the bundle AND the modules need to be included for the extension to work properly. The bundle provides the code, while the modules section activates them.

## ⚡ Quick Setup

### 1. Configure Module Options

You can customize the settings by adding options to the modules:

```javascript
const config = {
  root: import.meta,
  shortName: 'your-project-name',
  baseUrl: 'http://localhost:3000',
  bundles: [ '@bodonkey/stripe-payments-extension' ],
  modules: {
    '@bodonkey/stripe-payment': {
      options: {
        currency: 'usd',                    // Default currency
        successUrl: '/checkout/success',    // Custom success page (optional)
        cancelUrl: '/checkout/cancel',      // Custom cancel page (optional)

        // Email confirmation settings
        email: {
          enabled: true,
          fromAddress: 'orders@yourstore.com',
          fromName: 'Your Store Name',
          subject: 'Order Confirmation'
        }
      }
    },
    '@bodonkey/stripe-button-widget': {
      // Widget-specific options (if needed)
    }
  }
};
```

### 2. Set Your Stripe Key

The Stripe secret key can be configured in several ways. **If you're having issues with environment variables, try the export method first**:

#### Method 1: Export Environment Variable (Most Reliable)
```bash
export APOS_STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
npm run dev
```

#### Method 2: .env File
Create a `.env` file in your project root:
```bash
APOS_STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
```

> **⚠️ Important**: 
> - Add `.env` to your `.gitignore` file to keep your keys secure
> - If `.env` files aren't working, use the export method instead
> - Command line environment variables may not work reliably with all ApostropheCMS setups

#### Method 3: Module options (not recommended for production):
   ```javascript
   '@bodonkey/stripe-payment': {
     options: {
       apiSecret: process.env.APOS_STRIPE_SECRET_KEY || 'sk_test_your_key_here'
     }
   }
   ```


### 3. Configure Email (Optional)

If you want confirmation emails, ensure you have the ApostropheCMS email module configured:

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

## 🎯 Usage Options

> [!NOTE]
> Images will not be displayed in development because they require a web-accessible URL.

### Option 1: Drag-and-Drop Widget

Perfect for content editors who need to add payment buttons without touching code.

1. **Edit any page** in the ApostropheCMS admin
2. **Add a widget** to any area
3. **Choose "Stripe Payment Button"**
4. **Configure your product**:
   - Product name and price
   - Button text and styling
   - Optional product image
   - Currency selection

The widget provides a user-friendly interface with organized tabs for content, advanced settings, and styling options.

### Option 2: Template Helper (For Developers)

Use the template helper when you need programmatic control or want to integrate with existing product data:

```nunjucks
<!-- Basic usage -->
{{ apos.stripePayment.button({
  productId: product._id,
  price: product.price,
  name: product.title,
  image: apos.attachment.url(product.image)
}) }}

<!-- With custom styling -->
{{ apos.stripePayment.button({
  productId: product._id,
  price: product.price,
  name: product.title,
  buttonText: 'Buy Now - $' + product.price,
  class: 'btn btn-primary btn-lg',
  style: 'margin: 10px;'
}) }}
```

### Option 3: Custom HTML (Advanced)

For maximum control, add the required data attributes to any HTML element:

```html
<button class="stripe-checkout-button my-custom-class"
        data-product-id="{{ product._id }}"
        data-price="{{ product.price }}"
        data-name="{{ product.title }}"
        data-currency="usd"
        data-image="{{ apos.attachment.url(product.image) }}">
  Buy {{ product.title }} - ${{ product.price }}
</button>
```

## 🎨 Styling & Customization

### CSS Framework Integration

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

### Widget Styling Options

The button widget includes predefined styles:
- **Primary**: Modern gradient blue (default)
- **Secondary**: Professional gray
- **Success**: Green confirmation style
- **Custom**: Use your own CSS classes

### Custom CSS Example

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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
```

## 💰 Currency Support

Supported currencies with automatic formatting:

| Currency | Code | Symbol | Decimal Places |
|----------|------|--------|----------------|
| US Dollar | USD | $ | 2 |
| Euro | EUR | € | 2 |
| British Pound | GBP | £ | 2 |
| Japanese Yen | JPY | ¥ | 0 |
| Canadian Dollar | CAD | C$ | 2 |
| Australian Dollar | AUD | A$ | 2 |
| South Korean Won | KRW | ₩ | 0 |
| Swiss Franc | CHF | CHF | 2 |
| Chinese Yuan | CNY | ¥ | 2 |

Configure accepted currencies in your module options:

```javascript
'@bodonkey/stripe-payment': {
  options: {
    currency: 'usd',
    acceptedCurrencies: ['usd', 'eur', 'gbp', 'cad']
  }
}
```

## 📧 Email Confirmations

### Stripe vs. Custom Emails

You have two options for order confirmation emails:

**Option 1: Stripe's Built-in Emails** *(Recommended for simplicity)*
- Enable in your Stripe Dashboard under Settings → Emails
- Automatic, reliable, and requires no setup
- Limited customization options

**Option 2: Custom ApostropheCMS Emails** *(Recommended for branding)*
- Full control over design and content
- Matches your site's branding
- Requires email module configuration

### Custom Email Configuration

```javascript
'@bodonkey/stripe-payment': {
  options: {
    email: {
      enabled: true,                       // Enable confirmation emails
      fromAddress: 'orders@yourstore.com', // Required sender email
      fromName: 'Your Store Name',         // Friendly sender name
      ccToSender: true,                    // Send copy to your email
      replyTo: 'support@yourstore.com',    // Reply-to address
      subject: 'Your Order Confirmation',  // Email subject
      template: 'stripe-confirmation'      // Custom template name
    }
  }
}
```

### Email Template Data

The core module comes with an email template that can be used, but for a custom template, create a file at project level: `modules/@bodonkey/stripe-payment/views/emails/stripe-confirmation.html`. The template receives the same session data as the success page:

```html
<!-- Available template data: -->
{{ data.session.id }}                    <!-- Stripe session ID -->
{{ data.session.amount_total }}          <!-- Amount in cents -->
{{ data.session.currency }}              <!-- Currency code -->
{{ data.session.customer_name }}         <!-- Customer name -->
{{ data.session.customer_email }}        <!-- Customer email -->
{{ data.session.payment_status }}        <!-- Payment status -->
{{ data.session.created_date }}          <!-- Order date -->
{{ data.session.metadata.product_id }}   <!-- Your custom metadata -->
{{ data.session.metadata.source }}       <!-- Custom tracking data -->
{{ data.site.name }}                     <!-- Your site name -->
{{ data.site.url }}                      <!-- Your site URL -->

<!-- Complete order data structure: -->
{{ data.order.id }}              <!-- Same as session.id -->
{{ data.order.amount }}          <!-- Same as session.amount_total -->
{{ data.order.currency }}        <!-- Same as session.currency -->
{{ data.order.customerName }}    <!-- Same as session.customer_name -->
{{ data.order.customerEmail }}   <!-- Same as session.customer_email -->
{{ data.order.status }}          <!-- Same as session.payment_status -->
{{ data.order.date }}            <!-- Same as session.created_date -->
```

## ⚙️ Advanced Configuration

### Complete Options Reference

```javascript
'@bodonkey/stripe-payment': {
  options: {
    // Basic settings
    currency: 'usd',
    acceptedCurrencies: ['usd', 'eur', 'gbp'],

    // Page URLs
    successUrl: '/checkout/success',
    cancelUrl: '/checkout/cancel',

    // Stripe Checkout options
    collectShipping: false,
    collectPhone: false,
    allowPromotionCodes: true,

    // Custom metadata for all transactions
    metadata: {
      source: 'website',
      version: '1.0',
      campaign: 'holiday-sale'
    },

    // Email settings
    email: {
      enabled: true,
      fromAddress: 'orders@yourstore.com',
      fromName: 'Your Store',
      ccToSender: false,
      subject: 'Order Confirmation'
    }
  }
}
```

### Custom Success/Cancel Pages

Override default templates by creating custom views in your project:

**File Locations:**
- `modules/@bodonkey/stripe-payment/views/success.html`
- `modules/@bodonkey/stripe-payment/views/cancel.html`

**Available Template Data (Success Page):**

```javascript
{
  hasSession: true,              // Whether session data is available
  session: {
    id: 'cs_...',               // Stripe session ID
    amount_total: 2999,          // Amount in cents
    currency: 'usd',             // Currency code
    customer_email: 'user@example.com',
    customer_name: 'John Doe',
    payment_status: 'paid',      // Payment status
    created_date: '12/25/2024',  // Formatted date
    product_url: '/products/...',// Original product page
    referrer_url: '/',           // Where to redirect back
    metadata: {                  // Custom metadata you set
      product_id: 'widget-123',
      source: 'website'
    }
  },
  error: null                    // Error message if session retrieval failed
}
```

**Example Custom Success Template:**

```html
{% extends "layout.html" %}
{% block main %}
<div class="success-page">
  {% if data.hasSession %}
    <h1>Thank You!</h1>
    <p>Order #{{ data.session.id }}</p>

    <!-- Access your custom metadata -->
    {% if data.session.metadata.product_id %}
      <p>Product ID: {{ data.session.metadata.product_id }}</p>
    {% endif %}

    <a href="{{ data.session.referrer_url }}">Continue Shopping</a>
  {% endif %}
</div>
{% endblock %}
```

## 🧪 Testing

Use Stripe's test card numbers during development:

- **✅ Success**: `4242 4242 4242 4242`
- **❌ Decline**: `4000 0000 0000 0002`
- **🔐 3D Secure**: `4000 0000 0000 3220`

## 🚀 Production Deployment

### Security Checklist

- ✅ Use live Stripe keys (`sk_live_...`) in production
- ✅ Set `APOS_STRIPE_SECRET_KEY` environment variable
- ✅ Never commit API keys to version control
- ✅ Add `.env` to `.gitignore`
- ✅ Test thoroughly with small amounts first

### Environment Setup

```bash
# Production
export APOS_STRIPE_SECRET_KEY=sk_live_your_live_key_here

# SMTP for emails
export SMTP_USER=your-smtp-username
export SMTP_PASS=your-smtp-password
```

## 🌍 Localization & Internationalization

The extension comes with built-in English translations and can be easily localized for other languages.

### Adding Custom Languages

Create translation files in your project:

**For the Payment Module:**
```
modules/@bodonkey/stripe-payment/i18n/stripePayment/[language].json
```

**For the Button Widget:**
```
modules/@bodonkey/stripe-button-widget/i18n/stripeWidget/[language].json
```

### Example French Translation

`modules/@bodonkey/stripe-payment/i18n/stripePayment/fr.json`:
```json
{
  "buttons": {
    "buyNow": "Acheter maintenant",
    "loading": "Chargement...",
    "purchaseNow": "Acheter maintenant"
  },
  "success": {
    "title": "Paiement réussi !",
    "subtitle": "Merci pour votre achat. Votre commande a été confirmée.",
    "orderDetails": "Détails de la commande"
  },
  "errors": {
    "stripeNotConfigured": "Le système de paiement Stripe n'est pas configuré correctement."
  }
}
```

### Available Translation Keys

Check the existing English files for all available translation keys:
- **Payment Module**: `modules/@bodonkey/stripe-payment/i18n/stripePayment/en.json`
- **Button Widget**: `modules/@bodonkey/stripe-button-widget/i18n/stripeWidget/en.json`

The widget interface will automatically use your translations in the admin interface, and payment pages will display in the appropriate language based on ApostropheCMS locale settings.

## 🔧 API Reference

### Template Helper

```javascript
apos.stripePayment.button(options)
```

**Options:**
- `productId` (required): Unique product identifier
- `price` (required): Price in decimal format (e.g., 29.99)
- `name` (required): Product name for checkout
- `image` (optional): Product image URL
- `buttonText` (optional): Button text (default: "Buy Now")
- `class` (optional): Additional CSS classes
- `style` (optional): Inline CSS styles
- `disabled` (optional): Disable button

### REST Endpoints

- `POST /api/v1/@bodonkey/stripe-payment/create-checkout` - Create checkout session
- `GET /checkout/success` - Payment success page
- `GET /checkout/cancel` - Payment cancellation page

## 🤝 Contributing

Issues and pull requests are welcome! Please visit our [GitHub repository](https://github.com/BoDonkey/stripe-payments-extension).

## 📄 License

MIT License - see LICENSE file for details.

---

**Need Help?** Check out the [ApostropheCMS documentation](https://docs.apostrophecms.org) or join the community on Discord.