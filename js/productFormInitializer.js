/**
 * دالة لتهيئة نموذج إضافة المنتج
 */
/**
 * دالة لتهيئة نموذج إضافة المنتج
 */
async function productInitializeAddProductForm(editProductData = null) {
  console.log('%c[ProductForm] Initializing form...', 'color: blue;');
  
  // تنظيف الوحدة السابقة أولاً
  if (window.productModule && window.productModule.cleanup) {
    window.productModule.cleanup();
  }
  
  // تهيئة وحدات JavaScript أولاً
  if (!productInitializeModules()) {
    console.error('Failed to initialize product modules');
    return false;
  }
  
  const mainCategorySelect = document.getElementById("main-category");
  const subCategorySelect = document.getElementById("sub-category");
  const subCategoryGroup = document.getElementById("sub-category-group");
  const form = document.getElementById('add-product-form');
  
  if (!mainCategorySelect || !subCategorySelect || !form) {
    console.error('Required form elements not found');
    return false;
  }

  const images = window.productModule.images;
  images.length = 0;
  window.productModule.originalImageNames = [];

  const isEditMode = editProductData !== null;
  form.dataset.mode = isEditMode ? 'edit' : 'add';
  console.log(`[ProductForm] Mode: ${form.dataset.mode}`);
  
  if (isEditMode) {
    form.dataset.productKey = editProductData.product_key;
    console.log(`[ProductForm] Editing product with key: ${editProductData.product_key}`);
  }

  try {
    console.log('[ProductForm] Loading categories from ../shared/list.json');
    const response = await fetch("../shared/list.json");
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    const categories = data.categories;

    // تعبئة الفئات الرئيسية
    mainCategorySelect.innerHTML = '<option value="" selected disabled>-- اختر الفئة الرئيسية --</option>';
    categories.forEach((category) => {
      const option = new Option(category.title, category.id);
      mainCategorySelect.add(option);
    });
    console.log('%c[ProductForm] Main categories loaded successfully.', 'color: green;');

    // إعداد مستمع تغيير الفئة الرئيسية
    const mainCategoryHandler = productHandleMainCategoryChange(categories);
    mainCategorySelect.removeEventListener('change', mainCategoryHandler);
    mainCategorySelect.addEventListener("change", mainCategoryHandler);
    
  } catch (error) {
    console.error("%c[ProductForm] Failed to load categories:", 'color: red;', error);
    productShowError(mainCategorySelect, 'فشل في تحميل الفئات. يرجى المحاولة مرة أخرى.');
    return false;
  }

  // إذا كان في وضع التعديل، تعبئة البيانات
  if (isEditMode) {
    productPopulateEditForm(editProductData);
  }

  productSetupCharacterCounters();
  productSetupFormSubmit();
  
  console.log('%c[ProductForm] Form initialized successfully', 'color: green;');
  return true;
}

/**
 * تهيئة جميع الوحدات المطلوبة
 */
function productInitializeModules() {
  console.log('[ProductForm] Initializing all modules...');
  
  // تهيئة وحدة المنتج
  if (window.productModule && window.productModule.init) {
    if (!window.productModule.init()) {
      console.error('Failed to initialize product module');
      return false;
    }
  } else {
    console.error('Product module not available');
    return false;
  }
  
  return true;
}
/**
 * معالجة تغيير الفئة الرئيسية
 */
function productHandleMainCategoryChange(categories) {
  return (event) => {
    const selectedCategoryId = event.target.value;
    const subCategorySelect = document.getElementById("sub-category");
    const subCategoryGroup = document.getElementById("sub-category-group");
    const priceQuantityRow = document.getElementById('price-quantity-row');
    const quantityInput = document.getElementById('product-quantity');
    const priceInput = document.getElementById('product-price');
    const serviceTypeOptions = document.getElementById('service-type-options');
    const serviceTypeRadioInputs = document.querySelectorAll('input[name="serviceType"]');

    if (!subCategorySelect || !subCategoryGroup) return;

    // إعادة تعيين الفئات الفرعية
    subCategorySelect.innerHTML = '<option value="">-- اختر الفئة الفرعية --</option>';
    subCategorySelect.disabled = true;

    // إظهار/إخفاء حقول السعر والكمية
    if (priceQuantityRow && quantityInput && priceInput && serviceTypeOptions) {
      if (selectedCategoryId === SERVICE_CATEGORY_NoPrice_ID) {
        priceQuantityRow.style.display = 'none';
        quantityInput.required = false;
        priceInput.required = false;
        serviceTypeOptions.style.display = 'block';
        serviceTypeRadioInputs.forEach(radio => {
          radio.required = true;
        });
      } else {
        priceQuantityRow.style.display = 'flex';
        quantityInput.required = true;
        priceInput.required = true;
        serviceTypeOptions.style.display = 'none';
        serviceTypeRadioInputs.forEach(radio => {
          radio.checked = false;
          radio.required = false;
        });
      }
    }

    if (!selectedCategoryId) {
      subCategoryGroup.style.display = "none";
      return;
    }

    const selectedCategory = categories.find((cat) => cat.id == selectedCategoryId);

    if (selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0) {
      subCategoryGroup.style.display = "flex";
      subCategorySelect.disabled = false;
      selectedCategory.subcategories.forEach((sub) => {
        const option = new Option(sub.title, sub.id);
        subCategorySelect.add(option);
      });
    } else {
      subCategoryGroup.style.display = "none";
    }
  };
}

/**
 * تعبئة النموذج في وضع التعديل
 */
function productPopulateEditForm(editProductData) {
  console.log('[ProductForm] Populating form with existing product data.');
  
  // تحديث العنوان وزر الإرسال
  const titleElement = document.getElementById('addProductTitle');
  const submitButton = document.querySelector('.add-product-modal__submit-container .btn');
  
  if (titleElement) {
    titleElement.innerHTML = '<i class="fas fa-edit"></i> تعديل المنتج';
  }
  if (submitButton) {
    submitButton.textContent = 'حفظ التعديلات';
  }

  // تعبئة الحقول النصية
  document.getElementById('product-name').value = editProductData.productName || '';
  document.getElementById('product-description').value = editProductData.product_description || '';
  document.getElementById('seller-message').value = editProductData.user_message || '';
  document.getElementById('product-notes').value = editProductData.user_note || '';

  // تعبئة السعر والكمية
  const isServiceCategory = editProductData.MainCategory == SERVICE_CATEGORY_NoPrice_ID;
  const quantityInput = document.getElementById('product-quantity');
  const priceInput = document.getElementById('product-price');
  if (quantityInput && priceInput) {
    quantityInput.value = isServiceCategory ? 0 : (editProductData.product_quantity || '');
    priceInput.value = isServiceCategory ? 0 : (editProductData.product_price || '');
  }
  
  const originalPriceInput = document.getElementById('original-price');
  if (originalPriceInput) {
    originalPriceInput.value = editProductData.original_price || '';
  }

  // تعبئة نوع الخدمة
  const serviceTypeOptions = document.getElementById('service-type-options');
  const serviceTypeRadioInputs = document.querySelectorAll('input[name="serviceType"]');
  if (isServiceCategory && editProductData.serviceType > 0 && serviceTypeOptions) {
    serviceTypeOptions.style.display = 'block';
    serviceTypeRadioInputs.forEach(radio => {
      if (radio.value == editProductData.serviceType) {
        radio.checked = true;
      }
      radio.required = true;
    });
  }

  // تعبئة الصور
  if (editProductData.ImageName) {
    console.log('[ProductForm] Loading existing images:', editProductData.ImageName);
    const imageNames = editProductData.ImageName.split(',');
    window.productModule.originalImageNames = [...imageNames];
    
    imageNames.forEach(name => {
      if (!name) return;
      const id = window.productModule.genId();
      const state = {
        id: id,
        file: null,
        compressedBlob: null,
        status: 'uploaded',
        fileName: name
      };
      window.productModule.images.push(state);
      window.productModule.createPreviewItem(state, `https://pub-e828389e2f1e484c89d8fb652c540c12.r2.dev/${name}`);
    });
  }

  // تعبئة الفئات
  const mainCatId = editProductData.MainCategory;
  const subCatId = editProductData.SubCategory;
  const mainCategorySelect = document.getElementById('main-category');
  const subCategorySelect = document.getElementById('sub-category');

  if (mainCatId && mainCategorySelect) {
    mainCategorySelect.value = mainCatId;
    mainCategorySelect.dispatchEvent(new Event('change'));
  }
  
  if (subCatId && subCategorySelect) {
    setTimeout(() => { 
      subCategorySelect.value = subCatId; 
    }, 100);
  }
}


/**
 * إعداد عدادات الأحرف والتحقق في الوقت الفعلي
 */
function productSetupCharacterCounters() {
  const fields = [
    { id: 'product-name', counterId: 'product-name-char-counter' },
    { id: 'product-description', counterId: 'description-char-counter' },
    { id: 'seller-message', counterId: 'seller-message-char-counter' },
    { id: 'product-notes', counterId: 'notes-char-counter' }
  ];

  fields.forEach(field => {
    const element = document.getElementById(field.id);
    const counter = document.getElementById(field.counterId);
    
    if (element && counter) {
      element.addEventListener('input', () => {
        const currentLength = element.value.length;
        const maxLength = element.maxLength;
        counter.textContent = `${currentLength} / ${maxLength}`;
        
        // التحقق في الوقت الفعلي
        if (currentLength > 0) {
          productQuickValidateField(element);
        } else {
          productClearError(element);
        }
      });

      // التحقق عند فقدان التركيز
      element.addEventListener('blur', () => {
        productQuickValidateField(element);
      });

      // تشغيل الحدث مرة واحدة لتحديث القيمة الأولية
      element.dispatchEvent(new Event('input'));
    }
  });

  // إعداد مستمعي الأحداث لحقول الأرقام مع التحقق
  productSetupNumberFields();
}

/**
 * إعداد حقول الأرقام مع التحقق
 */
function productSetupNumberFields() {
  const quantityInput = document.getElementById('product-quantity');
  const priceInput = document.getElementById('product-price');
  const originalPriceInput = document.getElementById('original-price');

  if (quantityInput) {
    quantityInput.addEventListener('input', () => {
      let value = productNormalizeDigits(quantityInput.value);
      quantityInput.value = value.replace(/[^0-9]/g, '');
      if (quantityInput.value) {
        productQuickValidateField(quantityInput);
      } else {
        productClearError(quantityInput);
      }
    });

    quantityInput.addEventListener('blur', () => {
      productQuickValidateField(quantityInput);
    });
  }

  if (priceInput) {
    priceInput.addEventListener('input', () => {
      let value = productNormalizeDigits(priceInput.value);
      value = value.replace(/[^0-9.]/g, '');
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      priceInput.value = value;
      if (priceInput.value) {
        productQuickValidateField(priceInput);
      } else {
        productClearError(priceInput);
      }
    });

    priceInput.addEventListener('blur', () => {
      productQuickValidateField(priceInput);
    });
  }

  if (originalPriceInput) {
    originalPriceInput.addEventListener('input', () => {
      let value = productNormalizeDigits(originalPriceInput.value);
      value = value.replace(/[^0-9.]/g, '');
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      originalPriceInput.value = value;
      
      // التحقق من أن السعر الأصلي أكبر من السعر الحالي
      const priceInput = document.getElementById('product-price');
      if (originalPriceInput.value && priceInput && priceInput.value) {
        const originalPrice = parseFloat(originalPriceInput.value);
        const currentPrice = parseFloat(priceInput.value);
        if (originalPrice <= currentPrice) {
          productShowError(originalPriceInput, 'السعر قبل الخصم يجب أن يكون أكبر من السعر الحالي.');
        } else {
          productClearError(originalPriceInput);
        }
      } else {
        productClearError(originalPriceInput);
      }
    });
  }

  // التحقق من الفئات عند التغيير
  const mainCategorySelect = document.getElementById('main-category');
  const subCategorySelect = document.getElementById('sub-category');
  
  if (mainCategorySelect) {
    mainCategorySelect.addEventListener('change', () => {
      productClearError(mainCategorySelect);
    });
  }
  
  if (subCategorySelect) {
    subCategorySelect.addEventListener('change', () => {
      productClearError(subCategorySelect);
    });
  }
}



// جعل الدالة متاحة عالميًا
window.productInitializeAddProductForm = productInitializeAddProductForm;