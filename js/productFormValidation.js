/**
 * @file js/productFormValidation.js
 * @description Contains validation functions for the product add form and displays related error messages.
 */

/**
 * @description Displays an error message below the specified element in the product add form.
 *   Creates a new `div` element containing the error message and inserts it into the DOM after the target element.
 * @function productShowError
 * @param {HTMLElement} element - DOM element below which the error message will be shown.
 * @param {string} message - Error message to display.
 * @returns {void}
 * @throws {Error} - If `element` is null.
 * @see productClearError
 */
function productShowError(element, message) {
  if (!element) {
    console.error('Cannot show error: element is null');
    return;
  }

  productClearError(element);
  const errorDiv = document.createElement('div');
  errorDiv.className = 'add-product-modal__error-message';
  errorDiv.textContent = message;
  errorDiv.style.color = '#e74c3c';
  errorDiv.style.fontSize = '14px';
  errorDiv.style.marginTop = '5px';
  errorDiv.style.textAlign = 'right';

  // Insert error message directly after user element
  element.parentNode.insertBefore(errorDiv, element.nextSibling);
}

/**
 * @description Clears any existing error message below the specified element.
 *   Searches for the error message element associated with the target element and removes it from the DOM.
 * @function productClearError
 * @param {HTMLElement} element - DOM element to clear the error message from.
 * @returns {void}
 */
function productClearError(element) {
  if (!element) return;

  const parent = element.parentNode;
  if (!parent) return;

  const errorDiv = parent.querySelector('.add-product-modal__error-message');
  if (errorDiv && errorDiv.parentNode === parent) {
    parent.removeChild(errorDiv);
  }
}

/**
 * @description Performs comprehensive validation of all product add/edit form fields before submission.
 *   Checks required fields like images, categories, product name, description, price, and quantity.
 *   Displays error messages to the user in case of invalidity and scrolls to the first error.
 * @function productValidateForm
 * @returns {boolean} - `true` if form is valid and ready for submission, otherwise `false`.
 * @throws {Error} - If critical DOM elements are missing.
 * @see productShowError
 * @see productClearError
 */
function productValidateForm() {
  const form = document.getElementById('add-product-form');
  const extendedMode = form ? form.dataset.extendedMode : 'unknown';

  console.log(`%c[Validation] 🔍 Starting validation in mode: ${extendedMode}`,
    'color: teal; font-weight: bold;');

  let isValid = true;
  const images = window.productModule ? window.productModule.images : [];
  const uploaderEl = document.getElementById('image-uploader');

  console.log('[ProductForm] Images count:', images.length);
  console.log('[ProductForm] Uploader element:', uploaderEl);

  // 1. Check for at least one image
  if (uploaderEl) {
    productClearError(uploaderEl);
  }

  if (images.length === 0) {
    console.log('[ProductForm] No images found - showing error');
    if (uploaderEl) {
      productShowError(uploaderEl, 'يجب إضافة صورة واحدة على الأقل للمنتج.');
    } else {
      console.error('Uploader element not found for showing image error');
    }
    isValid = false;
  } else {
    console.log('[ProductForm] Images validation passed');
  }

  // 2. Check for main category selection
  const mainCategorySelect = document.getElementById('main-category');
  if (mainCategorySelect) {
    productClearError(mainCategorySelect);
    if (!mainCategorySelect.value) {
      productShowError(mainCategorySelect, 'يجب اختيار فئة رئيسية.');
      isValid = false;
    }
  }

  // 3. Check for sub-category selection (if visible and required)
  const subCategoryGroup = document.getElementById('sub-category-group');
  const subCategorySelect = document.getElementById('sub-category');
  if (subCategorySelect) {
    productClearError(subCategorySelect);
    if (subCategoryGroup && subCategoryGroup.style.display === 'flex' && !subCategorySelect.value) {
      productShowError(subCategorySelect, 'يجب اختيار فئة فرعية.');
      isValid = false;
    }
  }

  // 4. Check for product name
  const productNameInput = document.getElementById('product-name');
  if (productNameInput) {
    productClearError(productNameInput);
    if (!productNameInput.value.trim()) {
      productShowError(productNameInput, 'اسم المنتج مطلوب.');
      isValid = false;
    } else if (productNameInput.value.trim().length < 2) {
      productShowError(productNameInput, 'اسم المنتج يجب أن يكون على الأقل حرفين.');
      isValid = false;
    }
  }

  // 5. Check for product description
  const descriptionTextarea = document.getElementById('product-description');
  if (descriptionTextarea) {
    productClearError(descriptionTextarea);
    if (!descriptionTextarea.value.trim()) {
      productShowError(descriptionTextarea, 'وصف المنتج مطلوب.');
      isValid = false;
    } else if (descriptionTextarea.value.trim().length < 10) {
      productShowError(descriptionTextarea, 'وصف المنتج يجب أن يكون على الأقل 10 أحرف.');
      isValid = false;
    }
  }

  // 6. Check for seller message
  const sellerMessageTextarea = document.getElementById('seller-message');
  if (sellerMessageTextarea) {
    productClearError(sellerMessageTextarea);
    if (!sellerMessageTextarea.value.trim()) {
      productShowError(sellerMessageTextarea, 'رسالة البائع مطلوبة.');
      isValid = false;
    } else if (sellerMessageTextarea.value.trim().length < 10) {
      productShowError(sellerMessageTextarea, 'رسالة البائع يجب أن تكون على الأقل 10 أحرف.');
      isValid = false;
    }
  }

  const mainCategoryId = mainCategorySelect ? mainCategorySelect.value : null;

  // 7. Check quantity (for non-service categories)
  const quantityInput = document.getElementById('product-quantity');
  if (quantityInput) {
    productClearError(quantityInput);
    if (mainCategoryId !== SERVICE_CATEGORY_NoPrice_ID && (!quantityInput.value || parseFloat(quantityInput.value) < 1)) {
      productShowError(quantityInput, 'يجب إدخال كمية متاحة صالحة (1 على الأقل).');
      isValid = false;
    }
  }

  // 8. Check price (for non-service categories)
  const priceInput = document.getElementById('product-price');
  if (priceInput) {
    productClearError(priceInput);
    if (mainCategoryId !== SERVICE_CATEGORY_NoPrice_ID && (priceInput.value === '' || parseFloat(priceInput.value) <= 0)) {
      productShowError(priceInput, 'يجب إدخال سعر صالح للمنتج (أكبر من 0).');
      isValid = false;
    }
  }

  // 9. Check service type (only for category 6)
  if (mainCategoryId === SERVICE_CATEGORY_NoPrice_ID) {
    const selectedServiceType = document.querySelector('input[name="serviceType"]:checked');
    const serviceTypeOptions = document.getElementById('service-type-options');
    if (serviceTypeOptions) {
      productClearError(serviceTypeOptions);
      if (!selectedServiceType) {
        productShowError(serviceTypeOptions, 'يجب اختيار نوع الخدمة.');
        isValid = false;
      }
    }
  }

  // 10. Check that original price is greater than current price (if entered)
  const originalPriceInput = document.getElementById('original-price');
  if (originalPriceInput && originalPriceInput.value && priceInput && priceInput.value) {
    const originalPrice = parseFloat(originalPriceInput.value);
    const currentPrice = parseFloat(priceInput.value);
    if (originalPrice <= currentPrice) {
      productShowError(originalPriceInput, 'السعر قبل الخصم يجب أن يكون أكبر من السعر الحالي.');
      isValid = false;
    }
  }

  if (!isValid) {
    console.warn('[ProductForm] Validation failed with errors');

    // Scroll to the first field with error
    setTimeout(() => {
      const firstErrorElement = document.querySelector('.add-product-modal__error-message');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  } else {
    console.log('%c[ProductForm] Validation passed successfully.', 'color: green;');
  }

  return isValid;
}

/**
 * @description Quickly validates a single form field, typically used in real-time (during input or on blur).
 *   Provides immediate feedback to the user about data validity.
 * @function productQuickValidateField
 * @param {HTMLInputElement|HTMLTextAreaElement} field - Form field element to validate.
 * @returns {boolean} - `true` if field is valid, otherwise `false`.
 * @throws {Error} - If critical DOM elements are missing.
 * @see productShowError
 * @see productClearError
 */
function productQuickValidateField(field) {
  if (!field) return true;

  const fieldId = field.id;
  let isValid = true;
  let errorMessage = '';

  switch (fieldId) {
    case 'product-name':
      if (!field.value.trim()) {
        errorMessage = 'اسم المنتج مطلوب.';
        isValid = false;
      } else if (field.value.trim().length < 2) {
        errorMessage = 'اسم المنتج يجب أن يكون على الأقل حرفين.';
        isValid = false;
      }
      break;

    case 'product-description':
      if (!field.value.trim()) {
        errorMessage = 'وصف المنتج مطلوب.';
        isValid = false;
      } else if (field.value.trim().length < 10) {
        errorMessage = 'وصف المنتج يجب أن يكون على الأقل 10 أحرف.';
        isValid = false;
      }
      break;

    case 'seller-message':
      if (!field.value.trim()) {
        errorMessage = 'رسالة البائع مطلوبة.';
        isValid = false;
      } else if (field.value.trim().length < 10) {
        errorMessage = 'رسالة البائع يجب أن تكون على الأقل 10 أحرف.';
        isValid = false;
      }
      break;

    case 'product-quantity':
      const mainCategorySelect = document.getElementById('main-category');
      const mainCategoryId = mainCategorySelect ? mainCategorySelect.value : null;
      if (mainCategoryId !== SERVICE_CATEGORY_NoPrice_ID && (!field.value || parseFloat(field.value) < 1)) {
        errorMessage = 'يجب إدخال كمية متاحة صالحة (1 على الأقل).';
        isValid = false;
      }
      break;

    case 'product-price':
      const mainCategorySelect2 = document.getElementById('main-category');
      const mainCategoryId2 = mainCategorySelect2 ? mainCategorySelect2.value : null;
      if (mainCategoryId2 !== SERVICE_CATEGORY_NoPrice_ID && (field.value === '' || parseFloat(field.value) <= 0)) {
        errorMessage = 'يجب إدخال سعر صالح للمنتج (أكبر من 0).';
        isValid = false;
      }
      break;
  }

  if (!isValid) {
    productShowError(field, errorMessage);
  } else {
    productClearError(field);
  }

  return isValid;
}

/**
 * @description Clean up form and reset background on close
 * @function productCleanupForm
 * @returns {void}
 * @see productResetModalBackground
 */
function productCleanupForm() {
  console.log('%c[ProductForm] 🧹 Cleaning up form and resetting background', 'color: gray;');

  // إعادة تعيين لون الخلفية
  if (typeof productResetModalBackground === 'function') {
    productResetModalBackground();
  }

  // Cleanup other states if needed
  const form = document.getElementById('add-product-form');
  if (form) {
    delete form.dataset.extendedMode;
    delete form.dataset.mode;
    delete form.dataset.productKey;
  }
}
// Make functions globally available
window.productValidateForm = productValidateForm;
window.productQuickValidateField = productQuickValidateField;
window.productCleanupForm = productCleanupForm;