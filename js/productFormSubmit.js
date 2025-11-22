/**
 * معالجة إرسال نموذج المنتج
 */
function productSetupFormSubmit() {
  const form = document.getElementById('add-product-form');
  
  if (!form) {
    console.error('Form element not found for submit handler');
    return;
  }
  
  // إزالة أي مستمعين سابقين لمنع التكرار
  form.removeEventListener('submit', productHandleFormSubmit);
  
  form.addEventListener('submit', productHandleFormSubmit);
}

/**
 * معالجة إرسال النموذج
 */
async function productHandleFormSubmit(e) {
  e.preventDefault();
  console.log('%c[ProductForm] Submit event triggered.', 'color: blue;');
  
  // التحقق من الصحة
  if (!productValidateForm()) {
    console.warn('[ProductForm] Validation failed. Submission aborted.');
    return;
  }

  // معالجة الإرسال
  await productProcessFormSubmission();
}

/**
 * معالجة عملية إرسال النموذج
 */
async function productProcessFormSubmission() {
  const form = document.getElementById('add-product-form');
  
  console.log('%c[ProductForm] Validation passed. Starting submission process.', 'color: green;');
  
  // استخدام SweetAlert2 إذا متاح، وإلا استخدام confirm عادي
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: form.dataset.mode === 'edit' ? 'جاري تحديث المنتج...' : 'جاري إضافة المنتج...',
      text: 'الرجاء الانتظار قليلاً بينما يتم رفع الصور.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  } else {
    console.log('جاري حفظ المنتج...');
  }

  try {
    const productSerial = form.dataset.mode === 'edit' ? 
      form.dataset.productKey : productGenerateProductSerial();

    // حذف الصور القديمة في وضع التعديل
    if (form.dataset.mode === 'edit') {
      await productHandleImageDeletion();
    }

    // رفع الصور الجديدة والحصول على أسماء الملفات
    const uploadedImageFiles = await productUploadImages(productSerial);
    
    // تجميع بيانات المنتج مع الصور المحدثة
    const productData = productPrepareProductData(productSerial, uploadedImageFiles);
    
    // حفظ في قاعدة البيانات
    await productSaveToDatabase(productData, form.dataset.mode);
    
    // عرض رسالة النجاح
    await productShowSuccessMessage(form.dataset.mode);

  } catch (error) {
    console.error('%c[ProductForm] Submission failed with critical error:', 'color: red; font-weight: bold;', error);
    
    if (typeof Swal !== 'undefined') {
      Swal.fire('خطأ!', `فشل في حفظ المنتج: ${error.message}`, 'error');
    } else {
      alert(`فشل في حفظ المنتج: ${error.message}`);
    }
  }
}

/**
 * معالجة حذف الصور القديمة
 */
async function productHandleImageDeletion() {
  const originalImageNames = window.productModule.originalImageNames || [];
  const currentImages = window.productModule.images || [];
  
  // الحصول على أسماء الصور الحالية (القديمة والجديدة)
  const currentImageNames = currentImages.map(state => {
    // إذا كانت الصورة مرفوعة مسبقًا، استخدم fileName، وإلا فهي جديدة وسيتم رفعها
    return state.status === 'uploaded' ? state.fileName : null;
  }).filter(Boolean);

  console.log('[ProductForm] Original images:', originalImageNames);
  console.log('[ProductForm] Current images:', currentImageNames);
  
  // تحديد الصور المحذوفة: الموجودة في الأصلية وغير موجودة في الحالية
  const imagesToDelete = originalImageNames.filter(name => !currentImageNames.includes(name));
  
  if (imagesToDelete.length > 0) {
    console.log("[ProductForm] Deleting old images:", imagesToDelete);
    await Promise.all(imagesToDelete.map(name => 
      deleteFile2cf(name, (msg) => console.log('[CloudflareDelete]', msg))
        .catch(err => console.error(`فشل حذف الملف ${name}:`, err))
    ));
  } else {
    console.log("[ProductForm] No old images to delete");
  }
}

/**
 * رفع الصور الجديدة
 */
async function productUploadImages(productSerial) {
  const uploadedImageFiles = [];
  const imagesToUpload = window.productModule.images.filter(s => s.status === 'ready');
  
  console.log(`[ProductForm] Uploading ${imagesToUpload.length} new images...`);
  
  for (let i = 0; i < window.productModule.images.length; i++) {
    const state = window.productModule.images[i];
    
    // رفع الصور الجديدة فقط (status === 'ready')
    if (state.status !== 'ready' || !state.compressedBlob) continue;

    // إنشاء اسم ملف فريد
    const timestamp = Date.now();
    const fileName = `${i + 1}_${productSerial}_${timestamp}.webp`;
    
    // التحقق من وجود دالة الرفع
    if (typeof uploadFile2cf !== 'function') {
      throw new Error('دالة رفع الملفات غير متاحة (uploadFile2cf)');
    }
    
    console.log(`[ProductForm] Uploading new image: ${fileName}`);
    const result = await uploadFile2cf(state.compressedBlob, fileName, 
      (msg) => console.log('[CloudflareUpload]', msg));
    
    console.log(`[ProductForm] New image uploaded: ${result.file}`);
    
    // تحديث حالة الصورة لتعكس أنها مرفوعة الآن
    state.status = 'uploaded';
    state.fileName = result.file;
    
    uploadedImageFiles.push(result.file);
  }
  
  return uploadedImageFiles;
}

/**
 * تجهيز بيانات المنتج للإرسال
 */
function productPrepareProductData(productSerial, uploadedImageFiles) {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user || !user.user_key) {
    throw new Error("لم يتم العثور على مفتاح المستخدم (user_key). الرجاء تسجيل الدخول مرة أخرى.");
  }

  const mainCatForSubmit = document.getElementById('main-category').value;
  let finalServiceType = 0;
  
  // معالجة الفئة الخدمات
  if (mainCatForSubmit === SERVICE_CATEGORY_NoPrice_ID) {
    console.log('[ProductForm] Service category detected. Forcing price and quantity to 0 before submission.');
    document.getElementById('product-price').value = 0;
    document.getElementById('product-quantity').value = 0;
    
    const selectedServiceTypeRadio = document.querySelector('input[name="serviceType"]:checked');
    if (selectedServiceTypeRadio) {
      finalServiceType = parseInt(selectedServiceTypeRadio.value, 10);
    }
  }

  // تجميع جميع أسماء الصور النهائية
  const finalImageNames = [];
  
  // إضافة الصور الحالية (القديمة والجديدة)
  window.productModule.images.forEach(state => {
    if (state.fileName) {
      finalImageNames.push(state.fileName);
    }
  });
  
  // إضافة الصور التي تم رفعها حديثًا (في حالة عدم وجود fileName في state)
  uploadedImageFiles.forEach(fileName => {
    if (!finalImageNames.includes(fileName)) {
      finalImageNames.push(fileName);
    }
  });

  console.log('[ProductForm] Final image names:', finalImageNames);

  return {
    productName: productNormalizeArabicText(document.getElementById('product-name').value.trim()),
    user_key: user.user_key,
    product_key: productSerial,
    product_description: productNormalizeArabicText(document.getElementById('product-description').value.trim()),
    product_price: parseFloat(document.getElementById('product-price').value) || 0,
    product_quantity: parseInt(document.getElementById('product-quantity').value, 10) || 0,
    original_price: parseFloat(document.getElementById('original-price').value) || null,
    user_message: productNormalizeArabicText(document.getElementById('seller-message').value.trim()),
    user_note: productNormalizeArabicText(document.getElementById('product-notes').value.trim()),
    ImageName: finalImageNames.join(','),
    MainCategory: document.getElementById('main-category').value,
    SubCategory: document.getElementById('sub-category').value,
    ImageIndex: finalImageNames.length,
    serviceType: finalServiceType
  };
}

/**
 * حفظ البيانات في قاعدة البيانات
 */
async function productSaveToDatabase(productData, mode) {
  let dbResult;
  
  if (mode === 'edit') {
    console.log('[ProductForm] Sending UPDATE request to backend...');
    if (typeof updateProduct !== 'function') {
      throw new Error('دالة تحديث المنتج غير متاحة (updateProduct)');
    }
    dbResult = await updateProduct(productData);
  } else {
    console.log('[ProductForm] Sending ADD request to backend...');
    if (typeof addProduct !== 'function') {
      throw new Error('دالة إضافة المنتج غير متاحة (addProduct)');
    }
    dbResult = await addProduct(productData);
  }

  if (dbResult && dbResult.error) {
    throw new Error(`فشل حفظ بيانات المنتج: ${dbResult.error}`);
  }

  console.log('%c[ProductForm] Product saved to DB successfully.', 'color: green; font-weight: bold;');
}

/**
 * عرض رسالة النجاح
 */
async function productShowSuccessMessage(mode) {
  const successMessage = mode === 'edit' ? 
    'تم تحديث المنتج بنجاح.' : 'تم إضافة المنتج بنجاح.';
  
  if (typeof Swal !== 'undefined') {
    await Swal.fire('تم بنجاح!', successMessage, 'success');
  } else {
    alert(successMessage);
  }
  
  // إغلاق النافذة المنبثقة
  const closeBtn = document.getElementById("add-product-modal-close-btn");
  if (closeBtn) closeBtn.click();
  
  // تحديث عرض "منتجاتي"
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (loggedInUser && typeof showMyProducts === 'function') {
    showMyProducts(loggedInUser.user_key);
  }
}

// جعل الدوال متاحة عالميًا
window.productSetupFormSubmit = productSetupFormSubmit;
window.productHandleFormSubmit = productHandleFormSubmit;