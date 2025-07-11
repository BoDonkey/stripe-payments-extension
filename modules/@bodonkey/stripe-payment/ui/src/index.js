export default () => {
  const handleCheckout = async (button) => {
    const productId = button.dataset.productId;
    const price = button.dataset.price;
    const name = button.dataset.name;
    const image = button.dataset.image;
    const currency = button.dataset.currency;

    // Show loading state
    button.disabled = true;
    const buttonSpan = button.querySelector('span');
    const originalText = buttonSpan ? buttonSpan.textContent : button.textContent;
    if (buttonSpan) {
      buttonSpan.textContent = 'Loading...';
    } else {
      button.textContent = 'Loading...';
    }

    try {
      const response = await fetch('create-stripe-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          price: parseFloat(price),
          name,
          image,
          currency
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);

      // Reset button state
      button.disabled = false;
      if (buttonSpan) {
        buttonSpan.textContent = originalText;
      } else {
        button.textContent = originalText;
      }

      alert('Sorry, there was an error processing your request. Please try again.');
    }
  };

  const initStripeButtons = () => {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.stripe-checkout-button');
      if (button) {
        e.preventDefault();
        handleCheckout(button);
      }
    });
  };

  apos.util.onReady(initStripeButtons);
};