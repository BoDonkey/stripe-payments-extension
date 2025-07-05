export default {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'Stripe Payment Button'
  },
  fields: {
    add: {
      buttonText: {
        type: 'string',
        label: 'Button Text',
        def: 'Buy Now',
        required: true
      },
      productName: {
        type: 'string',
        label: 'Product Name',
        help: 'Name that appears in Stripe checkout',
        required: true
      },
      price: {
        type: 'float',
        label: 'Price',
        help: 'Price in dollars (e.g., 29.99)',
        required: true,
        min: 0.01
      },
      productImage: {
        type: 'attachment',
        label: 'Product Image',
        help: 'Optional image for Stripe checkout',
        fileGroup: 'images'
      },
      buttonStyle: {
        type: 'select',
        label: 'Button Style',
        choices: [
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Success', value: 'success' },
          { label: 'Custom', value: 'custom' }
        ],
        def: 'primary'
      },
      customClass: {
        type: 'string',
        label: 'Custom CSS Classes',
        help: 'Additional CSS classes for custom styling',
        if: { buttonStyle: 'custom' }
      },
      disabled: {
        type: 'boolean',
        label: 'Disabled',
        help: 'Disable the button temporarily',
        def: false
      }
    },
    group: {
      content: {
        label: 'Content',
        fields: ['buttonText', 'productName', 'price', 'productImage']
      },
      styling: {
        label: 'Styling',
        fields: ['buttonStyle', 'customClass', 'disabled']
      }
    }
  }
};