# آلية التعامل مع الفئة الخاصة (id=6)

يشرح هذا المستند بالتفصيل كيف يتعامل النظام مع الفئة التي تحمل المعرف `id = 6`، والتي تمثل فئة **"الخدمات العامة"**. يتم التعامل مع هذه الفئة بشكل خاص لضمان أن المنتجات التي تندرج تحتها (وهي خدمات) لا تتطلب سعرًا أو كمية، مما يوفر تجربة مستخدم منطقية وسلسة.

يتم تطبيق هذا المنطق الخاص في مكانين رئيسيين: عند إضافة المنتج وعند عرضه.

---

## 1. عند إضافة أو تعديل منتج (`addProduct.html`)

عندما يقوم البائع بإنشاء منتج جديد أو تعديل منتج موجود، يتم تطبيق منطق خاص فور اختيار فئة "الخدمات العامة".

### أ. التفاعل الفوري في واجهة المستخدم

بمجرد أن يختار البائع الفئة، يتم إخفاء حقول السعر والكمية وإلغاء كونها حقولاً إجبارية.

**الملف:** `pages/addProduct.html`
**الدالة:** `initializeAddProductForm`

```javascript
// إضافة مستمع للتغيير على الفئة الرئيسية
mainCategorySelect.addEventListener("change", (event) => {
  const selectedCategoryId = event.target.value;

  // إظهار أو إخفاء حقول السعر والكمية بناءً على الفئة الرئيسية
  const priceQuantityRow = document.getElementById('price-quantity-row');
  const quantityInput = document.getElementById('product-quantity');
  const priceInput = document.getElementById('product-price');
  
  // ---> هنا يكمن المنطق الأساسي <---
  if (selectedCategoryId === '6') { // id=6 هي "الخدمات العامة"
    priceQuantityRow.style.display = 'none'; // 1. إخفاء الصف الذي يحتوي على الحقول
    quantityInput.required = false; // 2. إلغاء شرط الإدخال الإجباري للكمية
    priceInput.required = false;    // 3. إلغاء شرط الإدخال الإجباري للسعر
  } else {
    priceQuantityRow.style.display = 'flex'; // 4. إظهار الحقول للفئات الأخرى
    quantityInput.required = true;
    priceInput.required = true;
  }
});
```

### ب. التحقق من صحة البيانات عند الإرسال

عند إرسال النموذج، يتجاوز النظام التحقق من وجود قيمة للسعر والكمية إذا كانت الفئة المختارة هي `6`.

**الملف:** `pages/addProduct.html`
**الحدث:** `form.addEventListener('submit', ...)`

```javascript
const mainCategoryIdForValidation = document.getElementById('main-category').value;

// 6. التحقق من الكمية
clearError(quantityInput);
// ---> هنا يتم تخطي التحقق <---
if (mainCategoryIdForValidation !== '6' && (!quantityInput.value || parseFloat(quantityInput.value) < 1)) {
  showError(quantityInput, 'يجب إدخال كمية متاحة صالحة (1 على الأقل).');
  isValid = false;
}

// 7. التحقق من السعر
clearError(priceInput);
// ---> وهنا أيضًا يتم تخطي التحقق <---
if (mainCategoryIdForValidation !== '6' && (priceInput.value === '' || parseFloat(priceInput.value) < 0)) {
  showError(priceInput, 'يجب إدخال سعر صالح للمنتج.');
  isValid = false;
}
```

### ج. ضمان سلامة البيانات عند الحفظ

كخطوة وقائية أخيرة قبل إرسال البيانات إلى قاعدة البيانات، يتم تعيين قيمة السعر والكمية إلى `0` بشكل إجباري لضمان اتساق البيانات.

**الملف:** `pages/addProduct.html`
**الحدث:** `form.addEventListener('submit', ...)`

```javascript
// قبل الإرسال، تأكد من أن قيم السعر والكمية هي 0 إذا كانت الفئة هي الخدمات
const mainCatForSubmit = document.getElementById('main-category').value;
if (mainCatForSubmit === '6') {
  console.log('[ProductForm] Service category detected. Forcing price and quantity to 0 before submission.');
  document.getElementById('product-price').value = 0;
  document.getElementById('product-quantity').value = 0;
}
```

---

## 2. عند عرض تفاصيل المنتج (`showProduct.html`)

عندما يقوم مستخدم بعرض تفاصيل منتج ينتمي لفئة "الخدمات العامة"، يتم تعديل الواجهة لإخفاء المعلومات غير ذات الصلة وأدوات الشراء.

**الملف:** `js/turo.js`
**الدالة:** `populateProductDetails`

```javascript
// إخفاء حقول السعر والكمية إذا كانت الفئة هي "الخدمات العامة" (id=6)
const isServiceCategory = productData.MainCategory == '6';
const quantityContainer = document.getElementById("product-modal-quantity-container");
const priceContainer = document.getElementById("product-modal-price-container");
const cartActionsContainer = document.getElementById("product-modal-cart-actions");

// ---> هنا يتم تكييف واجهة العرض <---
if (isServiceCategory) {
  quantityContainer.style.display = 'none'; // 1. إخفاء حاوية الكمية
  priceContainer.style.display = 'none';     // 2. إخفاء حاوية السعر
  cartActionsContainer.style.display = 'none'; // 3. إخفاء قسم "إضافة للسلة" بالكامل
} else {
  // إظهار الحقول وتعبئتها للمنتجات العادية
  quantityContainer.style.display = 'block';
  priceContainer.style.display = 'block';
  cartActionsContainer.style.display = 'block';
  document.getElementById("product-modal-quantity").textContent = productData.availableQuantity;
  document.getElementById("product-modal-price").textContent = `${productData.pricePerItem} جنيه`;
}
```

بهذه الطريقة، يضمن النظام تجربة متسقة ومنطقية عبر التطبيق بأكمله عند التعامل مع هذه الفئة الخاصة.