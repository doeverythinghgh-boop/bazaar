/**
 * @file js/connect1.js
 * @description طبقة الاتصال بالواجهة البرمجية (API Service Layer).
 *
 * هذا الملف يحتوي على مجموعة من الدوال غير المتزامنة (async functions) التي تسهل عملية
 * إرسال واستقبال البيانات من نقاط النهاية (API endpoints) الخاصة بالمشروع.
 * كل دالة هنا تتوافق مع عملية محددة مثل جلب المستخدمين، إضافة منتج، أو تحديث البيانات.
 * يعتمد على متغير `baseURL` العام الذي يجب تعريفه في `js/config.js`.
 */

/**
 * ينشئ طلبًا جديدًا في قاعدة البيانات عبر واجهة برمجة التطبيقات.
 * @async
 * @param {object} orderData - كائن يحتوي على جميع بيانات الطلب.
 * @param {string} orderData.order_key - المفتاح الفريد الذي تم إنشاؤه للطلب.
 * @param {string} orderData.user_key - مفتاح المستخدم الذي قام بالطلب.
 * @param {number} orderData.total_amount - المبلغ الإجمالي للطلب.
 * @param {Array<object>} orderData.items - مصفوفة من المنتجات الموجودة في الطلب.
 * @returns {Promise<Object>} كائن يحتوي على بيانات الطلب الذي تم إنشاؤه، أو كائن خطأ في حالة الفشل.
 */
async function createOrder(orderData) {
  return await apiFetch('/api/orders', {
    method: 'POST',
    body: orderData,
  });
}

/**
 * يجلب سجل المشتريات الخاص بمستخدم معين.
 * @async
 * @param {string} userKey - المفتاح الفريد للمستخدم (user_key) الذي نريد جلب مشترياته.
 * @returns {Promise<Array|null>} مصفوفة تحتوي على تفاصيل مشتريات المستخدم، أو `null` في حالة حدوث خطأ.
 */
async function getUserPurchases(userKey) {
  try {
    const purchases = await apiFetch(`/api/purchases?user_key=${userKey}`);
    if (purchases.error) {
      throw new Error(purchases.error);
    }

    console.log(
      "%c[API] getUserPurchases successful. Raw data:",
      "color: green;",
      purchases
    );

    // ✅ تحسين: يتم هنا دمج بيانات حالة الطلب (مثل النص والوصف) مع كل عنصر في المشتريات.
    // هذا يسهل على الواجهة الأمامية عرض حالة الطلب دون الحاجة إلى منطق إضافي.
    const purchasesWithStatus = purchases.map((purchase) => {
      // البحث عن كائن الحالة المطابق لـ `order_status` في مصفوفة `ORDER_STATUSES` المعرفة في `config.js`.
      const statusInfo = ORDER_STATUSES.find(
        (s) => s.id === purchase.order_status
      ) || { state: "غير معروف", description: "حالة الطلب غير معروفة." };
      return {
        ...purchase,
        status_details: statusInfo, // إضافة كائن `status_details` الذي يحتوي على (id, state, description).
      };
    });

    // تسجيل البيانات المعالجة وإرجاعها.
    console.log(
      "%c[API] getUserPurchases processed data with status info:",
      "color: darkcyan;",
      purchasesWithStatus
    );
    return purchasesWithStatus;
  } catch (error) {
    // تسجيل أي خطأ وإرجاع `null`.
    console.error("%c[getUserPurchases] failed:", "color: red;", error);
    return null;
  }
}

/**
 * يجلب بيانات حركة المشتريات الكاملة (مخصصة للمسؤولين والبائعين وخدمات التوصيل).
 * @async
 * @param {string} userKey - مفتاح المستخدم الذي يقوم بطلب التقرير للتحقق من صلاحياته.
 * @returns {Promise<Array|null>} مصفوفة من الطلبات المجمعة مع تفاصيلها، أو `null` في حالة الفشل.
 */
async function getSalesMovement(userKey) {
  try {
    const data = await apiFetch(`/api/sales-movement?user_key=${userKey}`);
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error("%c[getSalesMovement] failed:", "color: red;", error);
    return null;
  }
}

/**
 * يرسل إشعارًا فوريًا (Push Notification) إلى جهاز معين باستخدام توكن FCM.
 * @async
 * @param {string} token - توكن Firebase Cloud Messaging (FCM) الخاص بالجهاز المستهدف.
 * @param {string} title - عنوان الإشعار.
 * @param {string} body - نص الإشعار.
 * @returns {Promise<Object>} كائن يحتوي على نتيجة الإرسال من الخادم، أو كائن خطأ.
 */
async function sendNotification(token, title, body) {
  return await apiFetch('/api/send-notification', {
    method: 'POST',
    body: { token, title, body },
  });
}

/**
 * يحدث حالة طلب معين في قاعدة البيانات.
 * @param {string} orderKey - المفتاح الفريد للطلب المراد تحديثه.
 * @param {number} newStatusId - المعرف الرقمي للحالة الجديدة للطلب.
 * @returns {Promise<Object>} كائن الاستجابة من الخادم.
 */
async function updateOrderStatus(orderKey, newStatusId) {
  return await apiFetch('/api/orders', {
    method: 'PUT',
    body: {
      order_key: orderKey,
      order_status: newStatusId,
    },
  });
}

/**
 * يضيف سجلاً جديدًا إلى جدول `updates` في قاعدة البيانات.
 * يُستخدم هذا عادةً لتسجيل وقت آخر تغيير مهم في البيانات (مثل تحديث الإعلانات) للمساعدة في إدارة التخزين المؤقت (Caching).
 * @param {string} text - النص المراد تسجيله في التحديث.
 * @returns {Promise<Object>} كائن الاستجابة من الخادم، أو كائن خطأ.
 */
async function addUpdate(text) {
  return await apiFetch('/api/updates', {
    method: 'POST',
    body: { txt: text },
  });
}

/**
 * يجلب آخر تاريخ تحديث مسجل في جدول `updates`.
 * @async
 * @returns {Promise<Object|null>} كائن يحتوي على تاريخ التحديث (`{ datetime: '...' }`)، أو `null` في حالة الفشل.
 */
async function getLatestUpdate() {
  try {
    const data = await apiFetch('/api/updates', {
      specialHandlers: {
        404: () => ({ datetime: null }) // Not a fatal error
      }
    });
    return data;
  } catch (error) {
    console.error("%c[getLatestUpdate] failed:", "color: red;", error);
    return null;
  }
}
