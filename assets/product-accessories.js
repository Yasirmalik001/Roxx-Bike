class ProductAccessoriesSelector extends HTMLElement {
  constructor() {
    super();
    this.isSubmitting = false;
    this.temporarilyDisabled = false;
  }

  connectedCallback() {
    const section = this.closest('.shopify-section');
    this.productForm = section ? section.querySelector('product-form form') : null;
    this.productFormElement = section ? section.querySelector('product-form') : null;
    
    if (this.productForm) {
      this.productForm.addEventListener('submit', this.onSubmit.bind(this), { capture: true });
    }
  }

  async onSubmit(event) {
    if (this.temporarilyDisabled) return;

    const selectedAccessories = Array.from(this.querySelectorAll('input[type="checkbox"]:checked'));
    if (selectedAccessories.length === 0) return;

    // We have accessories to add, so intercept the submission
    event.preventDefault();
    event.stopImmediatePropagation();

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    // Show loading UI on the main product form
    const submitButton = this.productForm.querySelector('[type="submit"]');
    submitButton.setAttribute('aria-disabled', true);
    submitButton.classList.add('loading');
    if (this.productFormElement && this.productFormElement.querySelector('.loading__spinner')) {
      this.productFormElement.querySelector('.loading__spinner').classList.remove('hidden');
    }

    try {
      const items = selectedAccessories.map(checkbox => ({
        id: parseInt(checkbox.value),
        quantity: 1
      }));

      // Add accessories to cart via AJAX
      const response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ items })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add accessories to cart');
      }

      // Now resume the main product form submission
      this.temporarilyDisabled = true;
      this.isSubmitting = false;
      
      // Dispatch a new submit event that bypasses our capture listener
      this.productForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      
      this.temporarilyDisabled = false;
    } catch (e) {
      console.error('Error adding accessories to cart:', e);
      this.isSubmitting = false;
      submitButton.classList.remove('loading');
      submitButton.removeAttribute('aria-disabled');
      if (this.productFormElement && this.productFormElement.querySelector('.loading__spinner')) {
        this.productFormElement.querySelector('.loading__spinner').classList.add('hidden');
      }
    }
  }
}

if (!customElements.get('product-accessories-selector')) {
  customElements.define('product-accessories-selector', ProductAccessoriesSelector);
}
