# توثيق نظام سلة المشتريات (CardPackage)

## نظرة عامة

نظام سلة المشتريات هو نظام متكامل لإدارة عربة التسوق في التطبيق. يتيح للمستخدمين إضافة المنتجات، تعديل الكميات، إضافة ملاحظات، وإتمام عمليات الشراء.

## هيكل الملفات

```
pages/cardPackage/
├── cardPackage.html          # الواجهة الرئيسية لصفحة السلة
├── cardPackage.css           # التنسيقات والأنماط
└── js/
    ├── cardPackage.js        # وحدة إدارة السلة الأساسية (LocalStorage)
    ├── cartPackage-api.js    # خدمات API للطلبات
    ├── cartPackage-checkout.js  # منطق إتمام الشراء
    ├── cartPackage-ui.js     # عرض وتحديث واجهة المستخدم
    ├── cartPackage-notes.js  # إدارة الملاحظات
    ├── cartPackage-events.js # معالجة الأحداث والتفاعلات
    └── cartPackage-init.js   # تهيئة الصفحة
```

---

## الملفات والوحدات

### 1. cardPackage.html

**الغرض**: الهيكل الأساسي لصفحة سلة المشتريات.

**المكونات الرئيسية**:

#### أ. حاوية السلة (`cartPage_container`)
- **العناصر الرئيسية**:
  - `cartPage_cartLayout`: تخطيط شبكي يحتوي على قائمة المنتجات والملخص
  - `cartPage_cartItemsContainer`: حاوية عناصر السلة (يتم ملؤها ديناميكياً)
  - `cartPage_loadingIndicator`: مؤشر التحميل

#### ب. ملخص السلة (`cartPage_cartSummary`)
- **البيانات المعروضة**:
  - `cartPage_itemCount`: عدد المنتجات
  - `cartPage_subtotal`: المجموع الجزئي
  - `cartPage_savings`: التوفير من الخصومات
  - `cartPage_deliveryFee`: رسوم التوصيل (ثابتة: 40 ج.م)
  - `cartPage_total`: المجموع الكلي

- **الأزرار**:
  - `cartPage_checkoutBtn`: إتمام عملية الشراء
  - `cartPage_clearCartBtn`: تفريغ السلة بالكامل

#### ج. حالة السلة الفارغة (`cartPage_emptyCart`)
- يظهر عندما تكون السلة فارغة
- يحتوي على زر "متابعة التسوق"

#### د. نافذة تعديل الملاحظات (`cartPage_noteModal`)
- **العناصر**:
  - `cartPage_noteTextarea`: حقل إدخال الملاحظة
  - `cartPage_saveNoteBtn`: حفظ الملاحظة
  - `cartPage_cancelNoteBtn`: إلغاء التعديل
  - `cartPage_closeNoteModal`: إغلاق النافذة

#### هـ. رسالة نجاح طلب الصور (`cartPage_photoOrderMessage`)
- رسالة تظهر بعد إرسال طلب يحتوي على صور

---

### 2. cardPackage.css

**الغرض**: تنسيق وتصميم صفحة السلة.

**الأقسام الرئيسية**:

#### أ. التخطيط العام
- `.cartPage_container`: حاوية رئيسية بعرض أقصى 1200px
- `.cartPage_cart-layout`: شبكة من عمودين (قائمة المنتجات + الملخص)
  - يتحول لعمود واحد على الشاشات الصغيرة (<992px)

#### ب. بطاقات المنتجات
- `.cartPage_cart-item`: بطاقة منتج بتصميم جدول
  - خلفية بيضاء مع ظل تفاعلي
  - حدود شفافة بسمك 2px
  - **ملاحظة**: تم إزالة تأثيرات hover وفقاً لقواعد المشروع

#### ج. عناصر المنتج
- `.cartPage_cart-item-image`: صورة المنتج (120x120px)
- `.cartPage_cart-item-title`: عنوان المنتج
- `.cartPage_current-price`: السعر الحالي (بلون أساسي)
- `.cartPage_original-price`: السعر الأصلي (مشطوب)
- `.cartPage_discount-badge`: شارة الخصم (خلفية حمراء)

#### د. التحكم في الكمية
- `.cartPage_quantity-controls`: حاوية أزرار الكمية
- `.cartPage_quantity-btn`: أزرار (+/-) دائرية
- `.cartPage_quantity-input`: حقل إدخال الكمية

#### هـ. الملاحظات
- `.cartPage_note-text`: منطقة عرض الملاحظة
- `.cartPage_edit-note-btn`: زر تعديل الملاحظة (دائري، موضع مطلق)

#### و. النافذة المنبثقة
- `.cartPage_note-modal`: نافذة تعديل الملاحظات
  - خلفية شبه شفافة (rgba(0, 0, 0, 0.6))
  - محتوى مركزي بعرض أقصى 400px
  - رسوم متحركة للانزلاق (`modalSlideIn`)

#### ز. التصميم المتجاوب
- **768px**: تعديلات للأجهزة اللوحية
- **480px**: تعديلات للهواتف الصغيرة
- **576px**: تعديلات إضافية للشاشات الصغيرة جداً

---

### 3. cardPackage.js

**الغرض**: الوحدة الأساسية لإدارة السلة في LocalStorage.

**الدوال الرئيسية**:

#### أ. إدارة المفاتيح
```javascript
getCartStorageKey()
```
- **الوظيفة**: توليد مفتاح تخزين فريد للسلة بناءً على `user_key`
- **الإرجاع**: `cart_{user_key}` أو `null` إذا لم يكن المستخدم مسجلاً

#### ب. قراءة وحفظ السلة
```javascript
getCart()
```
- **الوظيفة**: استرجاع السلة من LocalStorage
- **الإرجاع**: مصفوفة من كائنات المنتجات (أو مصفوفة فارغة)
- **معالجة الأخطاء**: يعيد مصفوفة فارغة عند فشل التحليل

```javascript
saveCart(cart)
```
- **الوظيفة**: حفظ السلة في LocalStorage وإطلاق حدث `cartUpdated`
- **المعاملات**: `cart` - مصفوفة المنتجات

#### ج. إضافة وحذف المنتجات
```javascript
addToCart(product, quantity, note = "")
```
- **الوظيفة**: إضافة منتج للسلة أو تحديث كميته
- **التحقق**: منع المستخدم من شراء منتجاته الخاصة
- **السلوك**:
  - إذا كان المنتج موجوداً: تحديث الكمية
  - إذا كان جديداً: إضافته مع تاريخ الإضافة
- **الإرجاع**: `true` عند النجاح، `false` عند الفشل

```javascript
removeFromCart(productKey)
```
- **الوظيفة**: حذف منتج من السلة
- **المعاملات**: `productKey` - المفتاح الفريد للمنتج

#### د. تحديث البيانات
```javascript
updateCartQuantity(productKey, newQuantity)
```
- **الوظيفة**: تحديث كمية منتج معين
- **السلوك**: إذا كانت الكمية 0 أو أقل، يتم حذف المنتج

```javascript
updateCartItemNote(productKey, note)
```
- **الوظيفة**: تحديث ملاحظة منتج معين

```javascript
clearCart()
```
- **الوظيفة**: تفريغ السلة بالكامل

#### هـ. الحسابات
```javascript
getCartItemCount()
```
- **الوظيفة**: حساب إجمالي عدد الوحدات في السلة
- **الإرجاع**: عدد صحيح

```javascript
getCartTotalPrice()
```
- **الوظيفة**: حساب المجموع الكلي للأسعار
- **الإرجاع**: رقم عشري

```javascript
getCartTotalSavings()
```
- **الوظيفة**: حساب إجمالي التوفير من الخصومات
- **الحساب**: `(original_price - price) * quantity`

#### و. تحديث الشارة
```javascript
updateCartBadge()
```
- **الوظيفة**: تحديث شارة عدد المنتجات على زر السلة
- **العنصر المستهدف**: `#index-cart-btn`
- **السلوك**:
  - إنشاء شارة إذا لم تكن موجودة
  - إخفاء الشارة عندما تكون السلة فارغة

**الأحداث المستمعة**:
- `cartUpdated`: تحديث الشارة تلقائياً
- `DOMContentLoaded`: تحديث الشارة عند تحميل الصفحة

---

### 4. cartPackage-api.js

**الغرض**: خدمات API للتواصل مع الخادم.

**الدوال**:

```javascript
async createOrder(orderData)
```
- **الوظيفة**: إنشاء طلب جديد في قاعدة البيانات
- **المعاملات**:
  - `orderData.order_key`: المفتاح الفريد للطلب
  - `orderData.user_key`: مفتاح المستخدم
  - `orderData.total_amount`: المبلغ الإجمالي
  - `orderData.items`: مصفوفة المنتجات
- **الطريقة**: POST إلى `/api/orders`
- **الإرجاع**: Promise بكائن الطلب المُنشأ

---

### 5. cartPackage-checkout.js

**الغرض**: منطق إتمام عملية الشراء.

**الدوال**:

```javascript
async sendOrder2Excution()
```
- **الوظيفة**: إرسال الطلب للتنفيذ

**خطوات التنفيذ**:

1. **التحقق من الجلسة**:
   - استدعاء `showLoginAlert()` للتأكد من تسجيل الدخول

2. **جلب البيانات**:
   - الحصول على السلة من `getCart()`

3. **التحقق من السلة**:
   - إذا كانت فارغة، عرض رسالة تنبيه

4. **الحسابات**:
   - `cartPage_subtotal`: مجموع أسعار المنتجات
   - `deliveryFee`: 40.00 ج.م (ثابت)
   - `totalAmount`: المجموع الكلي
   - `orderKey`: توليد رقم تسلسلي فريد

5. **بناء بيانات الطلب**:
```javascript
{
  order_key: orderKey,
  user_key: userSession.user_key,
  total_amount: totalAmount,
  orderType: 0,  // 0 = منتج
  items: [
    {
      product_key,
      quantity,
      seller_key,
      note
    }
  ]
}
```

6. **رسالة التأكيد**:
   - عرض نافذة SweetAlert2 للتأكيد
   - إرسال الطلب عند الموافقة

7. **معالجة النتيجة**:
   - **عند النجاح**:
     - إرسال الإشعارات عبر `handlePurchaseNotifications()`
     - تفريغ السلة `clearCart()`
     - عرض رسالة نجاح مع رقم الطلب
   - **عند الفشل**:
     - عرض رسالة خطأ

---

### 6. cartPackage-ui.js

**الغرض**: عرض وتحديث واجهة المستخدم.

**الدوال**:

#### أ. تحميل السلة
```javascript
cartPage_loadCart()
```
- **الوظيفة**: عرض محتويات السلة في الصفحة

**خطوات التنفيذ**:

1. **التحقق من العناصر**:
   - فحص وجود `cartPage_cartItemsContainer`, `cartPage_emptyCart`, `cartPage_cartSummary`
   - الخروج إذا لم تكن موجودة (ليست صفحة السلة)

2. **جلب السلة**:
   - استدعاء `getCart()`

3. **معالجة السلة الفارغة**:
   - إخفاء حاوية المنتجات والملخص
   - إظهار رسالة السلة الفارغة

4. **بناء HTML للمنتجات**:
   - لكل منتج، إنشاء جدول يحتوي على:
     - **الصف الأول**: الصورة + المعلومات (الاسم، السعر، الخصم)
     - **الصف الثاني**: منطقة الملاحظات + زر التعديل
     - **الصف الثالث**: التحكم في الكمية + زر الحذف

5. **حساب الخصم**:
```javascript
discount = ((original_price - price) / original_price) * 100
savings = (original_price - price) * quantity
```

6. **تحديث الملخص**:
   - استدعاء `cartPage_updateCartSummary()`

#### ب. تحديث الملخص
```javascript
cartPage_updateCartSummary()
```
- **الوظيفة**: تحديث قسم ملخص السلة

**البيانات المحدثة**:
- عدد المنتجات: `getCartItemCount()`
- المجموع الجزئي: `getCartTotalPrice()`
- التوفير: `getCartTotalSavings()`
- رسوم التوصيل: 40.00 ج.م (ثابت)
- المجموع الكلي: `subtotal + deliveryFee`

---

### 7. cartPackage-notes.js

**الغرض**: إدارة ملاحظات المنتجات.

**المتغيرات العامة**:
- `cartPage_currentProductKeyForNote`: تخزين مفتاح المنتج الحالي

**الدوال**:

#### أ. فتح النافذة
```javascript
cartPage_openNoteModal(cartPage_productKey, cartPage_currentNote)
```
- **الوظيفة**: فتح نافذة تعديل الملاحظة
- **الخطوات**:
  1. حفظ `productKey` في المتغير العام
  2. ملء `cartPage_noteTextarea` بالملاحظة الحالية
  3. عرض النافذة بـ `display: flex`

#### ب. إغلاق النافذة
```javascript
cartPage_closeNoteModal()
```
- **الوظيفة**: إخفاء النافذة وإعادة تعيين المتغير العام

#### ج. حفظ الملاحظة
```javascript
cartPage_saveNote()
```
- **الوظيفة**: حفظ الملاحظة المُدخلة
- **الخطوات**:
  1. قراءة النص من `cartPage_noteTextarea`
  2. إزالة المسافات الزائدة بـ `trim()`
  3. استدعاء `updateCartItemNote()`
  4. إغلاق النافذة

---

### 8. cartPackage-events.js

**الغرض**: معالجة جميع الأحداث والتفاعلات.

**الدالة الرئيسية**:

```javascript
cartPage_setupEventListeners()
```

**الأحداث المُعالجة**:

#### أ. حدث تحديث السلة
```javascript
window.addEventListener('cartUpdated', ...)
```
- **الوظيفة**: إعادة تحميل السلة عند أي تحديث

#### ب. أحداث النقر (Event Delegation)
```javascript
document.addEventListener('click', ...)
```

**العناصر المُعالجة**:

1. **زيادة الكمية** (`.cartPage_plus`):
   - الحصول على المنتج من السلة
   - استدعاء `updateCartQuantity(productKey, quantity + 1)`

2. **تقليل الكمية** (`.cartPage_minus`):
   - التحقق من أن الكمية > 1
   - استدعاء `updateCartQuantity(productKey, quantity - 1)`

3. **حذف المنتج** (`.cartPage_remove-btn`):
   - عرض نافذة تأكيد SweetAlert2
   - استدعاء `removeFromCart()` عند الموافقة

4. **تعديل الملاحظة** (`.cartPage_edit-note-btn`):
   - الحصول على الملاحظة الحالية
   - استدعاء `cartPage_openNoteModal()`

#### ج. تغيير الكمية يدوياً
```javascript
document.addEventListener('blur', ...)
```
- **العنصر**: `.cartPage_quantity-input`
- **السلوك**:
  - إذا كانت الكمية > 0: تحديث الكمية
  - إذا كانت الكمية ≤ 0: طلب تأكيد الحذف أو إعادة تعيين الكمية لـ 1

#### د. تفريغ السلة
```javascript
cartPage_clearCartBtn.addEventListener('click', ...)
```
- عرض نافذة تأكيد
- استدعاء `clearCart()` عند الموافقة

#### هـ. إتمام الشراء
```javascript
cartPage_checkoutBtn.addEventListener('click', ...)
```
- التحقق من عدم فراغ السلة
- استدعاء `sendOrder2Excution()`

#### و. إدارة نافذة الملاحظات
- **إغلاق**: `cartPage_closeNoteModal`, `cartPage_cancelNoteBtn`
- **حفظ**: `cartPage_saveNoteBtn`
- **النقر خارج النافذة**: إغلاق تلقائي

---

### 9. cartPackage-init.js

**الغرض**: تهيئة الصفحة عند التحميل.

**المتغيرات العامة**:
```javascript
var cartPage_currentProductKeyForNote = '';
```

**التهيئة**:
```javascript
try {
    cartPage_loadCart();
    cartPage_setupEventListeners();
} catch (error) {
    console.error('حدث خطأ أثناء تهيئة الصفحة:', error);
}
```

**تحميل الهيدر**:
```javascript
insertUniqueSnapshot("../pages/header.html", "header-container10", 100);
```

---

## تدفق البيانات

### 1. إضافة منتج للسلة
```
[صفحة المنتج] 
    ↓ addToCart(product, quantity, note)
    ↓ saveCart(cart)
    ↓ localStorage.setItem()
    ↓ dispatchEvent('cartUpdated')
    ↓ updateCartBadge()
```

### 2. عرض السلة
```
[تحميل الصفحة]
    ↓ cartPage_init.js
    ↓ cartPage_loadCart()
    ↓ getCart() → localStorage.getItem()
    ↓ بناء HTML للمنتجات
    ↓ cartPage_updateCartSummary()
```

### 3. تعديل الكمية
```
[نقر على +/-]
    ↓ cartPackage-events.js
    ↓ updateCartQuantity(productKey, newQuantity)
    ↓ saveCart(cart)
    ↓ dispatchEvent('cartUpdated')
    ↓ cartPage_loadCart() (إعادة العرض)
```

### 4. إضافة ملاحظة
```
[نقر على زر التعديل]
    ↓ cartPage_openNoteModal()
    ↓ [إدخال النص]
    ↓ cartPage_saveNote()
    ↓ updateCartItemNote()
    ↓ saveCart(cart)
    ↓ dispatchEvent('cartUpdated')
```

### 5. إتمام الشراء
```
[نقر على إتمام الشراء]
    ↓ sendOrder2Excution()
    ↓ showLoginAlert() (تحقق)
    ↓ getCart()
    ↓ حساب المبالغ
    ↓ SweetAlert2 (تأكيد)
    ↓ createOrder(orderData) → POST /api/orders
    ↓ handlePurchaseNotifications()
    ↓ clearCart()
    ↓ رسالة نجاح
```

---

## الاعتماديات الخارجية

### المكتبات
- **SweetAlert2**: نوافذ التأكيد والتنبيهات
- **Font Awesome**: الأيقونات

### الدوال العامة المستخدمة
- `apiFetch()`: إرسال طلبات API
- `showLoginAlert()`: التحقق من تسجيل الدخول
- `generateSerial()`: توليد أرقام تسلسلية
- `handlePurchaseNotifications()`: إرسال الإشعارات
- `containerGoBack()`: الرجوع للصفحة السابقة
- `insertUniqueSnapshot()`: تحميل مكونات HTML
- `mainLoader()`: تحميل الصفحات

### المتغيرات العامة
- `window.userSession`: بيانات جلسة المستخدم
  - `user_key`: المفتاح الفريد للمستخدم

---

## معالجة الأخطاء

جميع الدوال تحتوي على كتل `try-catch` لمعالجة الأخطاء:

```javascript
try {
    // الكود الرئيسي
} catch (error) {
    console.error('رسالة الخطأ:', error);
}
```

**الأخطاء المُعالجة**:
- أخطاء تحليل JSON من LocalStorage
- أخطاء DOM (عناصر غير موجودة)
- أخطاء الشبكة (API)
- أخطاء التهيئة

---

## الأمان

### منع الشراء الذاتي
```javascript
if (userSession.user_key === product.seller_key) {
    // منع الشراء
}
```

### التحقق من تسجيل الدخول
- يتم التحقق قبل إتمام الشراء
- السلة مرتبطة بـ `user_key`

---

## الأداء

### التحسينات
1. **Event Delegation**: استخدام مستمع واحد للعناصر الديناميكية
2. **Lazy Loading**: تحميل السلة فقط عند الحاجة
3. **Defensive Checks**: فحص وجود العناصر قبل التعامل معها

### التخزين
- استخدام LocalStorage للتخزين المحلي
- تحديث تلقائي عبر الأحداث المخصصة

---

## التصميم المتجاوب

### نقاط التوقف (Breakpoints)
- **992px**: تحويل التخطيط من عمودين لعمود واحد
- **768px**: تعديلات الأجهزة اللوحية
- **576px**: تعديلات الهواتف
- **480px**: تعديلات الهواتف الصغيرة

### التكيف
- أزرار بعرض كامل على الشاشات الصغيرة
- نوافذ منبثقة بعرض 90% على الهواتف
- تخطيط عمودي للأزرار في النوافذ المنبثقة

---

## الإشعارات

### الأحداث المخصصة
```javascript
window.dispatchEvent(new CustomEvent('cartUpdated'))
```

**المستمعون**:
- `updateCartBadge()`: تحديث شارة العدد
- `cartPage_loadCart()`: إعادة عرض السلة

---

## الثوابت

### رسوم التوصيل
```javascript
const deliveryFee = 40.00; // ج.م
```

### نوع الطلب
```javascript
orderType: 0  // 0 = منتج
```

---

## ملاحظات مهمة

1. **تم إزالة تأثيرات Hover**: وفقاً لقواعد المشروع، تم حذف جميع سمات `:hover` من CSS

2. **التوافق مع الأجهزة اللمسية**: جميع التفاعلات تعمل بدون الحاجة لـ hover

3. **التوثيق الكامل**: جميع الدوال موثقة بـ JSDoc

4. **معالجة الأخطاء الشاملة**: كل دالة محمية بـ try-catch

5. **الأمان**: منع الشراء الذاتي والتحقق من الجلسة

---

## الصيانة والتطوير المستقبلي

### نقاط التحسين المحتملة
1. إضافة تخزين مؤقت للصور
2. دعم العملات المتعددة
3. حساب رسوم توصيل ديناميكية
4. دعم الكوبونات والخصومات
5. حفظ السلة على الخادم (Sync)

### الاختبارات الموصى بها
1. اختبار السلة الفارغة
2. اختبار الكميات الكبيرة
3. اختبار الشبكة البطيئة
4. اختبار الأجهزة المختلفة
5. اختبار المستخدمين المتعددين

---

**تاريخ التوثيق**: 2025-12-26  
**الإصدار**: 1.0  
**المطور**: نظام Bazaar
