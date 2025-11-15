/**
 * @file js/utils.js
 * @description يحتوي هذا الملف على دوال مساعدة عامة يمكن استخدامها في أي مكان في المشروع.
 * @param {boolean} [showAlert=false] - إذا كانت `true`، ستعرض الدالة تنبيهًا عند انقطاع الاتصال.
 */
// 🟦 تخزين مؤقت لحالة الاتصال
let lastConnectionCheck = 0;
let isConnectedCache = false;
const CONNECTION_CHECK_INTERVAL = 3000; // 3 ثوانٍ

async function checkInternetConnection(showAlert = true) {
  const now = Date.now();

  // 🟦 استخدام النتيجة المخزنة إذا كان آخر فحص حديثًا
  if (now - lastConnectionCheck < CONNECTION_CHECK_INTERVAL) {
    console.log(`[فحص الشبكة] استخدام النتيجة المخبأة: ${isConnectedCache}`);
    return isConnectedCache;
  }

  // سيتم تحديث وقت الفحص في النهاية مهما حصل
  lastConnectionCheck = now;

  try {
    // 1️⃣ فحص navigator.onLine
    if (!navigator.onLine) {
      if (showAlert) {
        Swal.fire('لا يوجد اتصال بالإنترنت', 'يرجى التحقق من اتصالك بالشبكة.', 'error');
      }
      isConnectedCache = false;
      return false;
    }

    // 2️⃣ اختبار اتصال فعلي عبر FETCH
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 ثوانٍ

    const response = await fetch("https://www.gstatic.com/generate_204", {
      method: "GET",
      cache: "no-cache",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // 3️⃣ إذا عادت استجابة 204 → الإنترنت يعمل فعلاً
    if (response.status === 204) {
      console.log("[فحص الشبكة] تم تأكيد الاتصال (تم استلام 204).");
      isConnectedCache = true;
      return true;
    }

    console.warn(`[فحص الشبكة] استجابة غير متوقعة: ${response.status}`);
    if (showAlert) {
        Swal.fire('لا يوجد اتصال بالإنترنت', 'يرجى التحقق من اتصالك بالشبكة.', 'error');
    }
    isConnectedCache = false;
    return false;

  } catch (error) {
    console.warn("[فحص الشبكة] خطأ:", error);
    if (showAlert) {
        Swal.fire('لا يوجد اتصال بالإنترنت', 'يرجى التحقق من اتصالك بالشبكة.', 'error');
    }
    isConnectedCache = false;
    return false;
  }
}
