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
  console.log(
    "%c[API] Starting createOrder with data:",
    "color: blue;",
    orderData
  );
  try {
    // إرسال طلب POST إلى نقطة النهاية الخاصة بالطلبات لإنشاء طلب جديد.
    const response = await fetch(`${baseURL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    // قراءة الاستجابة من الخادم كـ JSON.
    const data = await response.json();

    // التحقق مما إذا كان الطلب ناجحًا. إذا لم يكن كذلك، قم بإرجاع كائن خطأ.
    if (!response.ok) {
      return { error: data.error || `HTTP error! status: ${response.status}` };
    }

    // تسجيل النجاح وإرجاع البيانات المستلمة.
    console.log("%c[API] createOrder successful.", "color: green;", data);
    return data;
  } catch (error) {
    // تسجيل أي خطأ يحدث أثناء الاتصال بالشبكة وإرجاع كائن خطأ عام.
    console.error("%c[API] createOrder failed:", "color: red;", error);
    return { error: "فشل الاتصال بالخادم عند إنشاء الطلب." };
  }
}

/**
 * يجلب سجل المشتريات الخاص بمستخدم معين.
 * @async
 * @param {string} userKey - المفتاح الفريد للمستخدم (user_key) الذي نريد جلب مشترياته.
 * @returns {Promise<Array|null>} مصفوفة تحتوي على تفاصيل مشتريات المستخدم، أو `null` في حالة حدوث خطأ.
 */
async function getUserPurchases(userKey) {
  console.log(
    `%c[API] Starting getUserPurchases for user_key: ${userKey}`,
    "color: blue;"
  );
  try {
    // إرسال طلب GET لجلب المشتريات المرتبطة بمفتاح المستخدم المحدد.
    const response = await fetch(
      `${baseURL}/api/purchases?user_key=${userKey}`
    );

    // إذا لم يكن الطلب ناجحًا، اقرأ رسالة الخطأ من الخادم وألقِ خطأ.
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    // تحويل الاستجابة إلى JSON.
    const purchases = await response.json();
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
    console.error("%c[API] getUserPurchases failed:", "color: red;", error);
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
  console.log(
    `%c[API] Starting getSalesMovement for user_key: ${userKey}`,
    "color: blue;"
  );
  try {
    // إرسال طلب GET لجلب جميع الطلبات التي يمتلك المستخدم صلاحية رؤيتها.
    const response = await fetch(
      `${baseURL}/api/sales-movement?user_key=${userKey}`
    );

    // معالجة الأخطاء.
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    // تحويل الاستجابة إلى JSON وإرجاعها.
    const data = await response.json();
    console.log("%c[API] getSalesMovement successful.", "color: green;", data);
    return data;
  } catch (error) {
    // تسجيل أي خطأ وإرجاع `null`.
    console.error("%c[API] getSalesMovement failed:", "color: red;", error);
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
  console.log(
    `%c[API] Starting sendNotification to token: ${token.substring(0, 10)}...`,
    "color: blue;"
  );
  try {
    // إرسال طلب POST إلى نقطة النهاية المسؤولة عن إرسال الإشعارات.
    const response = await fetch(`${baseURL}/api/send-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, title, body }),
    });

    // قراءة استجابة الخادم.
    const data = await response.json();

    // التحقق من نجاح الطلب.
    if (!response.ok) {
      return { error: data.error || `HTTP error! status: ${response.status}` };
    }

    // تسجيل النجاح وإرجاع البيانات.
    console.log("%c[API] sendNotification successful.", "color: green;", data);
    return data;
  } catch (error) {
    // تسجيل أخطاء الشبكة.
    console.error("%c[API] sendNotification failed:", "color: red;", error);
    return { error: "فشل الاتصال بخادم الإشعارات." };
  }
}

/**
 * يحدث حالة طلب معين في قاعدة البيانات.
 * @param {string} orderKey - المفتاح الفريد للطلب المراد تحديثه.
 * @param {number} newStatusId - المعرف الرقمي للحالة الجديدة للطلب.
 * @returns {Promise<Object>} كائن الاستجابة من الخادم.
 */
async function updateOrderStatus(orderKey, newStatusId) {
  console.log(
    `%c[API] Starting updateOrderStatus for order_key: ${orderKey} to status: ${newStatusId}`,
    "color: blue;"
  );
  try {
    const response = await fetch(`${baseURL}/api/orders`, {
      // استخدام طريقة PUT لتحديث بيانات موجودة.
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_key: orderKey,
        order_status: newStatusId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    console.log("%c[API] updateOrderStatus successful.", "color: green;", data);
    return data;
  } catch (error) {
    console.error("%c[API] updateOrderStatus failed:", "color: red;", error);
    return { error: "فشل الاتصال بالخادم عند تحديث حالة الطلب." };
  }
}

/**
 * يضيف سجلاً جديدًا إلى جدول `updates` في قاعدة البيانات.
 * يُستخدم هذا عادةً لتسجيل وقت آخر تغيير مهم في البيانات (مثل تحديث الإعلانات) للمساعدة في إدارة التخزين المؤقت (Caching).
 * @param {string} text - النص المراد تسجيله في التحديث.
 * @returns {Promise<Object>} كائن الاستجابة من الخادم، أو كائن خطأ.
 */
async function addUpdate(text) {
  console.log(
    `%c[API] Starting addUpdate with text: "${text}"`,
    "color: blue;"
  );
  try {
    const response = await fetch(`${baseURL}/api/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txt: text }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    console.log("%c[API] addUpdate successful.", "color: green;", data);
    return data;
  } catch (error) {
    console.error("%c[API] addUpdate failed:", "color: red;", error);
    return { error: "فشل الاتصال بالخادم عند تسجيل التحديث." };
  }
}

/**
 * يجلب آخر تاريخ تحديث مسجل في جدول `updates`.
 * @async
 * @returns {Promise<Object|null>} كائن يحتوي على تاريخ التحديث (`{ datetime: '...' }`)، أو `null` في حالة الفشل.
 */
async function getLatestUpdate() {
  console.log(`%c[API] Starting getLatestUpdate...`, "color: blue;");
  try {
    const response = await fetch(`${baseURL}/api/updates`);

    if (!response.ok) {
      const errorData = await response.json();
      // لا نعتبر خطأ 404 (Not Found) خطأً فادحًا، بل يعني أنه لا توجد تحديثات مسجلة بعد.
      if (response.status === 404) return { datetime: null };
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("%c[API] getLatestUpdate successful.", "color: green;", data);
    return data;
  } catch (error) {
    console.error("%c[API] getLatestUpdate failed:", "color: red;", error);
    return null;
  }
}
