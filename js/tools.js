/**
 * @file js/helpers/format.js
 * @description يوفر دوال مساعدة لتنسيق النصوص والأرقام، مثل تحويل الأرقام الهندية إلى إنجليزية وتوحيد النص العربي.
 */



// دالة للتحقق من وجود جلسة مسؤول أصلية في التخزين المحلي.
function checkImpersonationMode() {
  const originalAdminSession = localStorage.getItem("originalAdminSession");
  if (originalAdminSession) {
    // إذا وجدت، يتم إنشاء عنصر HTML للعلامة المائية وإضافته إلى الصفحة.
    const watermark = document.createElement("div");
    watermark.className = "admin-watermark";
    watermark.innerHTML = `
          <i class="fas fa-user-shield"></i>
          <span>وضع المسؤول: تتصفح بصلاحيات المستخدم</span>
        `;
    document.body.appendChild(watermark);
  } else {
    const watermark = document.querySelector(".admin-watermark");
    if (watermark) {
      watermark.remove();
    }
  }
}

/**
 * @description يحول الأرقام الهندية (٠-٩) إلى أرقام إنجليزية (0-9) في سلسلة نصية.
 *   هذه الدالة مفيدة لمعالجة مدخلات المستخدم التي قد تحتوي على أرقام بأي من الصيغتين.
 * @function normalizeDigits
 * @param {string} str - السلسلة النصية التي قد تحتوي على أرقام.
 * @returns {string} - السلسلة النصية بعد تحويل الأرقام إلى الصيغة الإنجليزية.
 */
function normalizeDigits(str) {
  if (!str) return "";
  const easternArabicNumerals = /[\u0660-\u0669]/g; // نطاق الأرقام العربية الشرقية (الهندية)
  return str.replace(easternArabicNumerals, (d) => d.charCodeAt(0) - 0x0660);
}

/**
 * @description يقوم بتنقيح وتوحيد النص العربي عن طريق إزالة علامات التشكيل وتوحيد أشكال الحروف (الهمزات والتاء المربوطة).
 *   مفيد جدًا لعمليات البحث والمقارنة لضمان تطابق النصوص بغض النظر عن التشكيل.
 * @function normalizeArabicText
 * @param {string} text - النص العربي المراد تنقيحه.
 * @returns {string} - النص بعد إزالة التشكيل وتوحيد الحروف.
 */
function normalizeArabicText(text) {
  if (!text) return "";

  // إزالة التشكيل
  text = text.replace(/[\u064B-\u0652]/g, "");

  // توحيد الهمزات (أ، إ، آ) إلى ا
  text = text.replace(/[آأإ]/g, "ا");

  // تحويل التاء المربوطة (ة) إلى ه
  text = text.replace(/ة/g, "ه");

  // توحيد حرف الياء (ي / ى) إلى ي
  text = text.replace(/[ى]/g, "ي");

  // إزالة المد (ـــ)
  text = text.replace(/ـ+/g, "");

  // إزالة المسافات المكررة
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * @description يدمج معرف الحالة (status ID) مع التاريخ والوقت الحاليين في سلسلة نصية واحدة.
 *   التنسيق الناتج: "ID#TIMESTAMP" (مثال: "1#2023-10-27T10:00:00.000Z").
 *   هذه الدالة تُستخدم قبل إرسال تحديثات الحالة إلى الخادم.
 * @function composeOrderStatus
 * @param {number} statusId - المعرف الرقمي للحالة الجديدة.
 * @returns {string} - السلسلة النصية المدمجة.
 */
function composeOrderStatus(statusId) {
  const timestamp = new Date().toISOString();
  return `${statusId}#${timestamp}`;
}

/**
 * @description يفكك السلسلة النصية لحالة الطلب (القادمة من قاعدة البيانات) إلى كائن منظم.
 *   يتعامل مع الحالات التي تكون فيها القيمة غير صالحة أو قديمة (لا تحتوي على #).
 * @function parseOrderStatus
 * @param {string | null | undefined} statusValue - القيمة المخزنة في عمود `order_status`.
 * @returns {{statusId: number, timestamp: string | null}} - كائن يحتوي على معرف الحالة والتاريخ.
 */
function parseOrderStatus(statusValue) {
  if (!statusValue || typeof statusValue !== "string") {
    return { statusId: -1, timestamp: null }; // حالة غير معروفة أو قيمة فارغة
  }

  if (statusValue.includes("#")) {
    const [idStr, timestamp] = statusValue.split("#");
    return { statusId: parseInt(idStr, 10), timestamp: timestamp };
  }

  // للتعامل مع البيانات القديمة التي قد تكون مجرد رقم أو نص
  return { statusId: -1, timestamp: null }; // افترض أنها حالة غير معروفة إذا لم تكن بالتنسيق الجديد
}

/**
 * @description يعالج كائن طلب فردي لإضافة تفاصيل الحالة المنسقة إليه.
 *   هذه دالة مساعدة مركزية تُستخدم في طبقة الاتصال (connect1.js) لضمان
 *   أن جميع الطلبات القادمة من API تحتوي على `status_details` و `status_timestamp`.
 * @function processOrderStatus
 * @param {object} order - كائن الطلب الأصلي الذي يحتوي على `order_status`.
 * @returns {object} - كائن الطلب بعد إضافة الحقول المنسقة.
 * @see parseOrderStatus
 * @see ORDER_STATUSES
 */
function processOrderStatus(order) {
  const { statusId, timestamp } = parseOrderStatus(order.order_status);
  const statusInfo = ORDER_STATUSES.find((s) => s.id === statusId) || {
    state: "غير معروف",
    description: "حالة الطلب غير معروفة.",
  };
  return {
    ...order,
    status_details: statusInfo,
    status_timestamp: timestamp,
  };
}

/**
 * @function showError
 * @description تعرض رسالة خطأ تحت حقل الإدخال المحدد وتضيف فئة خطأ إليه.
 * @param {HTMLInputElement} input - عنصر الإدخال الذي حدث فيه الخطأ.
 * @param {string} message - رسالة الخطأ المراد عرضها.
 */
const showError = (input, message) => {
  // العثور على العنصر المخصص لعرض رسالة الخطأ.
  const errorDiv = document.getElementById(`${input.id}-error`);
  // إضافة فئة CSS لتغيير نمط حقل الإدخال (مثل تغيير لون الحدود إلى الأحمر).
  input.classList.add("input-error");
  // تعيين نص رسالة الخطأ.
  errorDiv.textContent = message;
};

/**
 * @function clearError
 * @description تزيل رسالة الخطأ من تحت حقل الإدخال المحدد وتزيل فئة الخطأ منه.
 * @param {HTMLInputElement} input - عنصر الإدخال لتنظيف الخطأ منه.
 * @returns {void}
 */
const clearError = (input) => {
  // العثور على عنصر رسالة الخطأ.
  const errorDiv = document.getElementById(`${input.id}-error`);
  // إزالة فئة الخطأ من حقل الإدخال.
  input.classList.remove("input-error");
  // تفريغ نص رسالة الخطأ.
  errorDiv.textContent = "";
};
function setUserNameInIndexBar() {
  let loginTextElement = document.getElementById("index-login-text");

  if (userSession && userSession.username) {
    if (loginTextElement) {
      let displayName = userSession.username;
      if (displayName.length > 8) {
        displayName = displayName.substring(0, 8) + "...";
      }
      loginTextElement.textContent = displayName;
    }
  } else {
    loginTextElement.textContent = "تسجيل الدخول";

  }
}
async function clearAllBrowserData() {
  // -----------------------------
  // 1) مسح localStorage
  // -----------------------------
  try {
    localStorage.clear();
  } catch (e) {
    console.warn("localStorage clear failed:", e);
  }

  // -----------------------------
  // 2) مسح sessionStorage
  // -----------------------------
  try {
    sessionStorage.clear();
  } catch (e) {
    console.warn("sessionStorage clear failed:", e);
  }



  // -----------------------------
  // 3) مسح IndexedDB
  // -----------------------------
  try {
    if ("indexedDB" in window) {
      const dbs = (await indexedDB.databases?.()) || [];

      for (const db of dbs) {
        if (db && db.name) {
          try {
            indexedDB.deleteDatabase(db.name);
          } catch (dbErr) {
            console.warn(`Delete IndexedDB "${db.name}" failed:`, dbErr);
          }
        }
      }
    }
  } catch (e) {
    console.warn("IndexedDB wipe failed:", e);
  }

  return true;
}

async function sendOrder2Excution() {
  // 1. جلب البيانات

  const cart = getCart();

  // التحقق من الشروط

  if (!userSession || !Number(userSession.is_seller) < 0) {
    Swal.fire({
      title: "مطلوب التسجيل",
      text: "لإتمام عملية الشراء، يجب عليك تسجيل الدخول أو إنشاء حساب جديد.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "تسجيل الدخول",
      cancelButtonText: "إلغاء",
    }).then((result) => {
      if (result.isConfirmed) {
        mainLoader(
          "./pages/login.html",
          "index-user-container",
          0,
          undefined,
          "hiddenLoginIcon",
          true
        );
      }
    });

    return;
  }
  if (cart.length === 0) {
    Swal.fire("السلة فارغة", "لا توجد منتجات في السلة لإتمام الشراء.", "info");
    return;
  }

  // 2. حساب المبلغ الإجمالي وإنشاء مفتاح الطلب
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const orderKey = generateOrderKey();

  const orderData = {
    order_key: orderKey,
    user_key: userSession.user_key,
    total_amount: totalAmount,
    items: cart.map((item) => ({
      product_key: item.product_key,
      quantity: item.quantity,
      product_key: item.product_key,
      quantity: item.quantity,
      seller_key: item.seller_key, // ✅ إضافة: إرسال مفتاح البائع مع كل عنصر
      note: item.note || "", // ✅ إضافة: إرسال الملاحظة مع كل عنصر
    })),
  };
  console.log("[Checkout] جاري إرسال بيانات الطلب:", orderData);

  // إظهار رسالة تأكيد
  const result = await Swal.fire({
    title: "تأكيد الطلب",
    text: `المبلغ الإجمالي هو ${totalAmount.toFixed(
      2
    )} جنيه. هل تريد المتابعة؟`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "نعم، أرسل الطلب!",
    cancelButtonText: "إلغاء",
    showLoaderOnConfirm: true,
    preConfirm: async () => {
      const response = await createOrder(orderData);
      console.log("[Checkout] الاستجابة من الخادم:", response);
      return response;
    },
    allowOutsideClick: () => !Swal.isLoading(),
  });

  if (result.isConfirmed && result.value && !result.value.error) {
    // ✅ إصلاح: استخلاص مفتاح الطلب من نتيجة SweetAlert
    const createdOrderKey = result.value.order_key;
    console.log(
      `[Checkout] Order created with key: ${createdOrderKey}. Now sending notifications.`
    );

    // 1. جلب توكنات البائعين
    const sellerKeys = getUniqueSellerKeys(orderData);
    const sellerTokens = await getUsersTokens(sellerKeys);

    // 2. جلب توكنات المسؤولين (من الدالة المركزية)
    //const adminTokens = await getAdminTokens();

    // 3. دمج جميع التوكنات وإزالة التكرار
    const allTokens = [
      ...new Set([...(sellerTokens || [])]),
    ];
    try {
      // 4. إرسال الإشعارات باستخدام الدالة العامة
      const title = "طلب شراء جديد";
      const body = `تم استلام طلب شراء جديد رقم #${createdOrderKey}. يرجى المراجعة.`;
      await sendNotificationsToTokens(allTokens, title, body);
    } catch (error) { console.log(error); }
    console.log(
      "[Checkout] نجاح! تم تأكيد الطلب من قبل المستخدم وإنشاءه بنجاح."
    );
    clearCart(); // هذه الدالة تحذف السلة وتطلق حدث 'cartUpdated'

    // ✅ إصلاح: عرض رسالة النجاح، وبعد إغلاقها، يتم إعادة رسم نافذة السلة لتظهر فارغة.
    Swal.fire("تم إتمام طلبك بنجاح 🎉").then(() => {
    });
  } else if (result.value && result.value.error) {
    console.error("[Checkout] فشل! الخادم أعاد خطأ:", result.value.error);
    Swal.fire("حدث خطأ", `فشل إرسال الطلب: ${result.value.error}`, "error");
  }
}
const pageSnapshots = {};

async function insertUniqueSnapshot(pageUrl, containerId) {
  try {
    // حفظ النسخة إذا لم تكن موجودة
    if (!pageSnapshots[pageUrl]) {
      const response = await fetch(pageUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("فشل تحميل: " + pageUrl);
      pageSnapshots[pageUrl] = await response.text();
    }

    // إزالة النسخ السابقة من DOM
    document
      .querySelectorAll(`[data-page-url="${pageUrl}"]`)
      .forEach((el) => el.remove());

    // إدراج النسخة
    const container = document.getElementById(containerId);
    if (!container) throw new Error("لا يوجد عنصر: " + containerId);

    container.replaceChildren();
    container.innerHTML = pageSnapshots[pageUrl];
    container.setAttribute("data-page-url", pageUrl);

    // تشغيل جميع السكربتات
    const scripts = container.querySelectorAll("script");

    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");

      // نسخ attributes
      for (const attr of oldScript.attributes) {
        newScript.setAttribute(attr.name, attr.value);
      }

      // لو السكربت داخلي
      if (!oldScript.src) {
        let code = oldScript.textContent.trim();

        // تغليف تلقائي داخل IIFE لمنع إعادة تعريف المتغيرات
        code = `(function(){\n${code}\n})();`;

        newScript.textContent = code;
      } else {
        // سكربت خارجي → نضيف وسوم تمنع التكرار
        const uniqueSrc = oldScript.src + "?v=" + Date.now();
        newScript.src = uniqueSrc;

        if (oldScript.type) newScript.type = oldScript.type;
      }

      oldScript.replaceWith(newScript);
    });

  } catch (err) {
    console.error("خطأ:", err);
  }
}

/**
 * دالة تقوم بتحميل جزء HTML من ملف خارجي ودمجه داخل صفحة أخرى،
 * مع إعادة تشغيل السكربتات بداخله بشكل كامل،
 * وتنتظر فترة زمنية بعد اكتمال كل شيء.
 *
 * @param {string} pageUrl - رابط الملف الخارجي المراد تحميله
 * @param {string} containerId - معرف العنصر الذي سيحتوي على المحتوى
 * @param {number} waitMs - فترة الانتظار بعد اكتمال تحميل وتشغيل كل شيء
 */
async function loader(pageUrl, containerId, waitMs = 300) {
  try {
    // ================================
    // 1) جلب الملف عبر fetch
    // ================================
    let response, html;
    try {
      response = await fetch(pageUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("فشل تحميل الملف: " + pageUrl);
      html = await response.text();
    } catch (fetchError) {
      console.error("خطأ أثناء جلب الملف:", fetchError);
      return;
    }

    // ================================
    // 2) إدراج المحتوى داخل العنصر الهدف
    // ================================
    let container;
    try {
      container = document.getElementById(containerId);
      if (!container)
        throw new Error("لم يتم العثور على العنصر: " + containerId);

      // تفريغ المحتوى لضمان عدم بقاء سكربتات قديمة
      container.replaceChildren();

      container.innerHTML = html;
    } catch (domError) {
      console.error("خطأ في إدراج المحتوى داخل DOM:", domError);
      return;
    }

    // ================================
    // 3) استخراج جميع السكربتات وتشغيلها من جديد
    // ================================
    try {
      const scripts = [...container.querySelectorAll("script")];

      for (const oldScript of scripts) {
        const newScript = document.createElement("script");

        // نقل النوع (مهم للـ ES Modules)
        if (oldScript.type) newScript.type = oldScript.type;

        // لو السكربت خارجي
        if (oldScript.src) {
          newScript.src = oldScript.src;
          newScript.async = oldScript.async || false; // الحفاظ على async
        }

        // لو السكربت داخلي
        if (oldScript.innerHTML.trim() !== "") {
          newScript.textContent = oldScript.innerHTML;
        }

        // نقل خصائص السكربت (dataset, attributes)
        for (const attr of oldScript.attributes) {
          if (attr.name !== "src" && attr.name !== "type")
            newScript.setAttribute(attr.name, attr.value);
        }

        oldScript.replaceWith(newScript);
      }
    } catch (scriptError) {
      console.error("خطأ أثناء تشغيل السكربتات:", scriptError);
      return;
    }

    // ================================
    // 4) الانتظار بعد اكتمال كل شيء
    // ================================
    try {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    } catch (delayError) {
      console.warn("خطأ أثناء الانتظار:", delayError);
    }

  } catch (globalError) {
    console.error("خطأ غير متوقع في الدالة loader:", globalError);
  }
}



/////////////////////////////////


