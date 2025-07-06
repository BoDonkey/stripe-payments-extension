import Stripe from 'stripe';

const CURRENCY_CONFIG = {
  usd: { decimals: 2, min: 0.01, symbol: '$', label: 'US Dollar' },
  eur: { decimals: 2, min: 0.01, symbol: '€', label: 'Euro' },
  gbp: { decimals: 2, min: 0.01, symbol: '£', label: 'British Pound' },
  jpy: { decimals: 0, min: 1, symbol: '¥', label: 'Japanese Yen' },
  cad: { decimals: 2, min: 0.01, symbol: 'C$', label: 'Canadian Dollar' },
  aud: { decimals: 2, min: 0.01, symbol: 'A$', label: 'Australian Dollar' },
  krw: { decimals: 0, min: 1, symbol: '₩', label: 'South Korean Won' },
  kwd: { decimals: 3, min: 0.001, symbol: 'KD', label: 'Kuwaiti Dinar' }
};

export default {
  extend: '@apostrophecms/module',
  options: {
    alias: 'stripePayments',
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
      }
    }
  },
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
          return '<div class="error">Missing required payment button parameters</div>';
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

        return `<button${classAttr}${styleAttr}${disabledAttr} ${dataAttrs}><span>${self.apos.util.escapeHtml(buttonText)}</span></button>`;
      }
    };
  },
  apiRoutes(self) {
    return {
      post: {
        async createCheckout(req) {
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
                message: `Unsupported currency: ${sessionCurrency}`,
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
            console.error('Stripe error details:', error);
            return {
              status: 'error',
              message: error.message,
              details: error.stack
            };
          }
        }
      }
    };
  }
};
