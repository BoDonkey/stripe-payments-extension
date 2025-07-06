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
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'stripeWidget:label',
    currencyConfig: CURRENCY_CONFIG
  },
  i18n: {
    stripeWidget: {
      browser: true
    }
  },
  init(self) {
    // Check if the payment module is available
    if (!self.apos.modules['stripe-payment']) {
      throw new Error( __t('stripeWidget:installErrorOne')
      );
    }

    // Check if Stripe is properly configured
    const paymentModule = self.apos.modules['stripe-payment'];
    if (!paymentModule.stripe) {
      self.apos.util.warn(
        __t('stripeWidget:installErrorTwo')
      );
    }
  },
  fields: {
    add: {
      buttonText: {
        type: 'string',
        label: 'stripeWidget:buttonText.lable',
        help: 'stripeWidget:buttonText.help',
        required: true
      },
      productName: {
        type: 'string',
        label: 'stripeWidget:productName.label',
        help: 'stripeWidget:productName.help',
        required: true
      },
      currency: {
        type: 'select',
        label: 'StripeWidget:currency.label',
        help: 'StripeWidget:currency.help',
        choices: [
          { label: 'stripeWidget:currency.siteDefault', value: '' },
          ...Object.entries(CURRENCY_CONFIG).map(([code, config]) => ({
            label: `${config.label} (${code.toUpperCase()})`,
            value: code
          }))
        ],
        def: ''
      },
      price: {
        type: 'float',
        label: 'stripeWidget:price.label',
        help: 'stripeWidget:price.help',
        required: true,
        min: 0.001
      },
      productImage: {
        type: 'attachment',
        label: 'stripeWidget:productImage.label',
        help: 'stripeWidget:productImage.help',
        fileGroup: 'images'
      },
      buttonStyle: {
        type: 'select',
        label: 'stripeWidget:buttonStyle.label',
        choices: [
          { label: 'stripeWidget:buttonStyle.choices.primary', value: 'primary' },
          { label: 'stripeWidget:buttonStyle.choices.secondary', value: 'secondary' },
          { label: 'stripeWidget:buttonStyle.choices.success', value: 'success' },
          { label: 'stripeWidget:buttonStyle.choices.custom', value: 'custom' }
        ],
        def: 'primary'
      },
      customClass: {
        type: 'string',
        label: 'stripeWidget:customClass.label',
        help: 'stripeWidget:customClass.help',
        if: { buttonStyle: 'custom' }
      },
      disabled: {
        type: 'boolean',
        label: 'styleWidget:disabled.label',
        help: 'styleWidget:disabled.help',
        def: false
      }
    },
    group: {
      content: {
        label: 'stripeWidget:group.content',
        fields: ['buttonText', 'productName', 'price', 'productImage']
      },
      advanced: {
        label: 'stripeWidget:group.advanced',
        fields: ['currency']
      },
      styling: {
        label: 'stripeWidget:group.styling',
        fields: ['buttonStyle', 'customClass', 'disabled']
      }
    }
  },
  handlers(self) {
    return {
      beforeSave: {
        validatePrice(req, piece) {
          const currency = piece.currency ||
            self.paymentModule.options.currency ||
            'usd';

          const config = self.options.currencyConfig[currency];
          if (!config) {
            throw new Error(`Unsupported currency: ${currency}`);
          }

          // Validate minimum amount
          if (piece.price < config.min) {
            throw new Error(
              `Price must be at least ${config.min} ${currency.toUpperCase()}`
            );
          }

          // Validate decimal places
          const decimals = (piece.price.toString().split('.')[1] || '').length;
          if (decimals > config.decimals) {
            throw new Error(
              `${currency.toUpperCase()} supports maximum ${config.decimals} decimal places`
            );
          }
        }
      }
    };
  },
  helpers(self) {
    return {
      currency(widget) {
        return widget.currency ||
          self.paymentModule.options.currency ||
          'usd';
      },

      formatPrice(widget) {
        const currency = widget.currency ||
          self.paymentModule.options.currency ||
          'usd';
        const config = self.options.currencyConfig[currency];

        if (!config) return widget.price;

        return config.decimals === 0
          ? Math.round(widget.price).toString()
          : widget.price.toFixed(config.decimals);
      },

      getCurrencySymbol(widget) {
        const currency = widget.currency ||
          self.paymentModule.options.currency ||
          'usd';
        return self.options.currencyConfig[currency]?.symbol || '$';
      }
    };
  }
};