import Stripe from 'stripe';

export default {
  options: {
    alias: 'stripePayments',
    currency: 'usd',
    successUrl: '/checkout/success',
    cancelUrl: '/checkout/cancel',
    collectShipping: false,
    collectPhone: false,
    allowPromotionCodes: false,
    apiSecret: null,
    metadata: {},
    shippingCountries: ['US', 'CA', 'GB', 'AU'],
    buttonDefaults: {
      text: 'Buy Now',
      class: 'stripe-checkout-button',
      loadingText: 'Loading...'
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

        return `<button${classAttr}${styleAttr}${disabledAttr} ${dataAttrs}>${self.apos.util.escapeHtml(buttonText)}</button>`;
      }
    };
  },
  apiRoutes(self) {
    return {
      post: {
        // Create a Stripe checkout session
        async createCheckout(req) {
          try {
            if (!self.stripe) {
              throw new Error('Stripe not configured');
            }
            const { productId, price, name, image } = req.body;
            if (!productId || !price || !name) {
              return {
                status: 'error',
                message: 'Missing required fields',
                required: ['productId', 'price', 'name'],
                received: req.body
              };
            }

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

            // Build checkout session config
            const sessionConfig = {
              payment_method_types: ['card'],
              line_items: [
                {
                  price_data: {
                    currency: self.options.currency,
                    product_data: {
                      name: name,
                      images: processedImages
                    },
                    unit_amount: Math.round(parseFloat(price) * 100)
                  },
                  quantity: 1
                }
              ],
              mode: 'payment',
              success_url: `${baseUrl}${self.options.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${baseUrl}${self.options.cancelUrl}`,
              metadata: {
                product_url: req.get('referer') || baseUrl,
                product_id: productId,
                ...(self.options.metadata || {})
              }
            };

            // Add optional features
            if (self.options.collectShipping) {
              sessionConfig.shipping_address_collection = {
                allowed_countries: ['US', 'CA', 'GB', 'AU'] // Add more as needed
              };
            }

            if (self.options.collectPhone) {
              sessionConfig.phone_number_collection = {
                enabled: true
              };
            }

            if (self.options.allowPromotionCodes) {
              sessionConfig.allow_promotion_codes = true;
            }

            const session = await self.stripe.checkout.sessions.create(sessionConfig);

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
  },
  get: {
    '/checkout/success': async (req, res) => {
      try {
        let sessionData = null;
        let error = null;

        if (req.query.session_id) {
          try {
            const session = await self.stripe.checkout.sessions.retrieve(req.query.session_id);
            sessionData = {
              id: session.id,
              amount_total: session.amount_total,
              currency: session.currency,
              customer_email: session.customer_details?.email,
              customer_name: session.customer_details?.name,
              payment_status: session.payment_status,
              created_date: new Date(session.created * 1000).toLocaleDateString(),
              referrer_url: session.metadata?.referrer_url || '/',
              product_url: session.metadata?.product_url || '/'
            };
            self.apos.util.log(`Payment successful: ${session.id} - ${session.amount_total / 100} ${session.currency.toUpperCase()}`);
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
