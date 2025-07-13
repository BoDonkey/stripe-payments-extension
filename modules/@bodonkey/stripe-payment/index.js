import Stripe from 'stripe';
import { CURRENCY_CONFIG } from './lib/currencies.js';

export default {
  extend: '@apostrophecms/module',
  options: {
    alias: 'stripePayment',
    currency: 'usd',
    currencyConfig: CURRENCY_CONFIG,
    acceptedCurrencies: ['usd'],
    successUrl: '/checkout/success',
    cancelUrl: '/checkout/cancel',
    collectShipping: false,
    collectPhone: false,
    allowPromotionCodes: false,
    apiSecret: null,
    metadata: {},
    shippingCountries: ['US', 'CA', 'GB', 'AU'],
    buttonDefaults: {
      textKey: 'stripePayment:buttons.buyNow',
      class: 'stripe-checkout-button',
      loadingTextKey: 'stripePayment:buttons.loading'
    },
    // Email configuration options
    email: {
      enabled: false,                    // Enable/disable confirmation emails
      fromAddress: null,                 // From email address (required if enabled)
      fromName: 'Your Store',           // From name for emails
      ccToSender: false,                // Send a copy to the from address
      replyTo: null,                    // Reply-to address (optional)
      subject: 'Order Confirmation',     // Email subject
      template: 'stripe-confirmation',   // Email template name
      attachReceipt: false              // Attach PDF receipt (future feature)
    }
  },
  i18n: {
    stripePayment: {
      browser: true
    }
  },
  init(self) {
    const secretKey = process.env.APOS_STRIPE_SECRET_KEY || self.options.apiSecret;

    if (secretKey) {
      // Validate the key format
      if (!secretKey.startsWith('sk_')) {
        throw new Error('Invalid Stripe secret key format. Key must start with "sk_"');
      }

      self.stripe = new Stripe(secretKey);
      self.apos.util.log('Stripe payments module initialized successfully');
    } else {
      self.apos.util.warn('Warning: Stripe secret key not found. Set APOS_STRIPE_SECRET_KEY environment variable or pass apiSecret in module options. Stripe functionality will not work.');
    }

    // Validate email configuration if enabled
    if (self.options.email.enabled) {
      if (!self.options.email.fromAddress) {
        throw new Error('Stripe payments: email.fromAddress is required when email.enabled is true');
      }
      // Check if ApostropheCMS email module is available
      if (!self.apos.modules['@apostrophecms/email']) {
        self.apos.util.warn('Warning: Email module not available. Stripe confirmation emails will not be sent.');
        self.options.email.enabled = false;
      } else {
        self.apos.util.log('Stripe confirmation emails enabled');
      }
    }
  },
  methods(self) {
    return {
      calculateStripeAmount(price, currency) {
        const config = self.options.currencyConfig[currency.toLowerCase()];
        if (!config) {
          throw new Error(`Unsupported currency: ${currency}`);
        }

        if (config.decimals === 0) {
          return Math.round(price);
        } else {
          return Math.round(price * Math.pow(10, config.decimals));
        }
      },

      formatCurrency(amount, currency) {
        const config = self.options.currencyConfig[currency.toLowerCase()];
        if (!config) return amount.toString();

        return config.decimals === 0
          ? Math.round(amount).toString()
          : amount.toFixed(config.decimals);
      },

      async sendConfirmationEmail(sessionData, req) {
        if (!self.options.email.enabled || !self.apos.modules['@apostrophecms/email']) {
          return;
        }

        try {
          const emailData = {
            session: sessionData,
            order: {
              id: sessionData.id,
              amount: sessionData.amount_total,
              currency: sessionData.currency,
              status: sessionData.payment_status,
              date: sessionData.created_date,
              customerName: sessionData.customer_name,
              customerEmail: sessionData.customer_email
            },
            site: {
              name: self.apos.shortName || 'Your Store',
              url: self.apos.page.getBaseUrl(req) || req.protocol + '://' + req.get('host')
            }
          };

          const recipients = [sessionData.customer_email].filter(Boolean);

          // Add CC to sender if enabled
          const ccRecipients = [];
          if (self.options.email.ccToSender && self.options.email.fromAddress) {
            ccRecipients.push(self.options.email.fromAddress);
          }

          if (recipients.length === 0) {
            self.apos.util.warn('No customer email found for order confirmation:', sessionData.id);
            return;
          }

          const emailOptions = {
            to: recipients,
            cc: ccRecipients.length > 0 ? ccRecipients : undefined,
            from: self.options.email.fromAddress,
            fromName: self.options.email.fromName,
            replyTo: self.options.email.replyTo || self.options.email.fromAddress,
            subject: self.options.email.subject
          };

          await self.email(req, self.options.email.template, emailData, emailOptions);

          self.apos.util.log(`Confirmation email sent for order: ${sessionData.id} to ${recipients.join(', ')}`);

          if (ccRecipients.length > 0) {
            self.apos.util.log(`CC sent to: ${ccRecipients.join(', ')}`);
          }

        } catch (error) {
          self.apos.util.error('Failed to send confirmation email:', error);
          // Don't throw - email failure shouldn't break the success page
        }
      }
    }
  },
  // In your helpers section of modules/@bodonkey/stripe-payment/index.js

  helpers(self) {
    return {
      button(options = {}) {
        const {
          productId,
          price,
          name,
          image = '',
          buttonText = 'Buy Now',
          class: cssClass = '',
          style = '',
          disabled = false
        } = options;

        if (!productId || !price || !name) {
          return self.apos.template.safe('<div class="error">Missing required payment button parameters</div>');
        }

        const dataAttrs = [
          `data-product-id="${self.apos.util.escapeHtml(productId)}"`,
          `data-price="${self.apos.util.escapeHtml(price)}"`,
          `data-name="${self.apos.util.escapeHtml(name)}"`,
          `data-image="${self.apos.util.escapeHtml(image)}"`
        ].join(' ');

        const classAttr = cssClass ? ` class="stripe-checkout-button ${self.apos.util.escapeHtml(cssClass)}"` : ' class="stripe-checkout-button"';
        const styleAttr = style ? ` style="${self.apos.util.escapeHtml(style)}"` : '';
        const disabledAttr = disabled ? ' disabled' : '';

        const html = `<button${classAttr}${styleAttr}${disabledAttr} ${dataAttrs}><span>${self.apos.util.escapeHtml(buttonText)}</span></button>`;

        // Return safe HTML that doesn't need the |safe filter
        return self.apos.template.safe(html);
      }
    };
  },
  apiRoutes(self) {
    return {
      post: {
        '/create-stripe-checkout': async (req, res) => {
          try {
            if (!self.stripe) {
              throw new Error(req.t('stripePayment:errors.stripeNotConfigured'));
            }

            const { productId, price, name, image, currency } = req.body;
            if (!productId || !price || !name) {
              return {
                status: 'error',
                message: req.t('stripePayment:errors.missingFields'),
                required: ['productId', 'price', 'name'],
                received: req.body
              };
            }

            const sessionCurrency = currency || self.options.currency || 'usd';

            const acceptedCurrencies = self.options.acceptedCurrencies || Object.keys(self.options.currencyConfig);
            if (!acceptedCurrencies.includes(sessionCurrency.toLowerCase())) {
              return {
                status: 'error',
                message: req.t('stripePayment:errors.unsupportedCurrency'),
                acceptedCurrencies
              };
            }

            const stripeAmount = self.calculateStripeAmount(price, sessionCurrency);

            // Get base URL
            let baseUrl = self.apos.page.getBaseUrl(req);
            if (!baseUrl) {
              const protocol = req.protocol;
              const host = req.get('host');
              baseUrl = `${protocol}://${host}`;
            }

            // Process image URL
            let processedImages = [];
            if (image && image.trim()) {
              let imageUrl = image.trim();
              if (imageUrl.startsWith('/')) {
                imageUrl = baseUrl + imageUrl;
              }
              if (imageUrl.match(/^https?:\/\/.+/)) {
                if (!imageUrl.includes('localhost') && !imageUrl.includes('127.0.0.1')) {
                  processedImages.push(imageUrl);
                }
              }
            }

            const session = await self.stripe.checkout.sessions.create({
              payment_method_types: ['card'],
              line_items: [
                {
                  price_data: {
                    currency: sessionCurrency.toLowerCase(),
                    product_data: {
                      name: name,
                      images: processedImages
                    },
                    unit_amount: stripeAmount
                  },
                  quantity: 1
                }
              ],
              mode: 'payment',
              success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${baseUrl}/checkout/cancel`,
              metadata: {
                product_url: req.get('referer') || baseUrl,
                product_id: productId,
                original_currency: sessionCurrency,
                original_price: price,
                ...(self.options.metadata || {})
              }
            });

            return {
              url: session.url,
              sessionId: session.id
            };
          } catch (error) {
            self.apos.util.error('Stripe error details:', error);
            return {
              status: 'error',
              message: error.message,
              details: error.stack
            };
          }
        }
      }
    }
  },
  routes(self) {
    return {
      // Handle the checkout success page
      get: {
        '/checkout/success': async (req, res) => {
          try {
            let sessionData = null;
            let error = null;
            // Check if we have a session_id from Stripe
            if (req.query.session_id) {
              try {
                // Retrieve the session from Stripe
                const session = await self.stripe.checkout.sessions.retrieve(req.query.session_id);
                // Extract relevant data for the template
                sessionData = {
                  id: session.id,
                  amount_total: session.amount_total,
                  currency: session.currency,
                  customer_email: session.customer_details?.email,
                  customer_name: session.customer_details?.name,
                  payment_status: session.payment_status,
                  // Format the date on the server side
                  created_date: new Date(session.created * 1000).toLocaleDateString(),
                  // Add referrer information from metadata
                  referrer_url: session.metadata?.referrer_url || '/',
                  product_url: session.metadata?.product_url || '/'
                };
                // Log successful payment for your records
                self.apos.util.log(`Payment successful: ${session.id} - ${session.amount_total / 100} ${session.currency.toUpperCase()}`);
                self.sendConfirmationEmail(sessionData, req);
              } catch (stripeError) {
                self.apos.util.error('Error retrieving Stripe session:', stripeError);
                error = 'Unable to retrieve payment information';
              }
            }
            await self.sendPage(req, 'success', {
              session: sessionData,
              error: error,
              hasSession: !!sessionData
            });
          } catch (error) {
            self.apos.util.error('Error rendering success page:', error);
            return res.status(500).send('error');
          }
        },

        '/checkout/cancel': async (req, res) => {
          try {
            await self.sendPage(req, 'cancel', {});
          } catch (error) {
            self.apos.util.error('Error rendering cancel page:', error);
            return res.status(500).send('error');
          }
        }
      }
    };
  }
};
