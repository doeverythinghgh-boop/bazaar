

// ===============================
//   FCM - Main Entry Point
// ===============================
async function setupFCM() {
    // [تحديث] إزالة التحقق من fcmInitialized للسماح بإعادة التهيئة عند تحديث الصفحة
    // if (sessionStorage.getItem("fcmInitialized")) {
    //     console.log("[FCM] تم التهيئة مسبقًا – سيتم التخطي.");
    //     return;
    // }

    // التأكد من المستخدم
    if (!userSession || !userSession.user_key) {
        console.warn("[FCM] لا يوجد مستخدم مسجل — إلغاء العملية.");
        return;
    }

    // أولوية التهيئة على أندرويد
    if (window.Android && typeof window.Android.onUserLoggedIn === "function") {
        await setupFirebaseAndroid();
    } else {
        await setupFirebaseWeb();
    }

    sessionStorage.setItem("fcmInitialized", "1");
}



// ===============================
//   1) Service Worker Registrar
// ===============================
async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        console.warn("[FCM] المتصفح لا يدعم Service Workers.");
        return false;
    }

    // تحذير عند العمل بدون HTTPS
    const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
    if (location.protocol !== "https:" && !isLocalhost) {
        console.warn("[FCM] تنبيه: الموقع يعمل عبر HTTP. قد يفشل تسجيل Service Worker إلا إذا تم تكوين المتصفح للسماح بذلك.");
        // لن نوقف التنفيذ هنا، سنترك المتصفح يقرر ما إذا كان سيقبل التسجيل أم لا
    }

    try {
        console.log("[SW] جاري تسجيل Service Worker...");
        const reg = await navigator.serviceWorker.register("firebase-messaging-sw.js");
        console.log("[SW] تم التسجيل بنجاح.");
        return reg;
    } catch (err) {
        console.error("[SW] فشل تسجيل Service Worker:", err);
        return false;
    }
}



// ===============================
//   2) FCM for Android WebView
// ===============================
async function setupFirebaseAndroid() {
    console.log("[Android FCM] تهيئة FCM للاندرويد...");

    const existingToken = localStorage.getItem("android_fcm_key");

    if (!existingToken) {
        console.log("[Android FCM] لا يوجد توكن — طلب توكن جديد من النظام...");

        // طلب التوكن من WebView
        try {
            window.Android.onUserLoggedIn(userSession.user_key);
        } catch (e) {
            console.error("[Android FCM] خطأ أثناء استدعاء onUserLoggedIn:", e);
        }

        // انتظار تخزين التوكن من النظام
        await waitForFcmKey(async (newToken) => {
            console.log("[Android FCM] تم الحصول على التوكن:", newToken);
            await sendTokenToServer(userSession.user_key, newToken, "android");
        }, 10000); // timeout

    } else {
        console.log("[Android FCM] التوكن موجود محليًا:", existingToken);
    }
}



// ===============================
//   3) FCM for Web Browsers
// ===============================
async function setupFirebaseWeb() {
    console.log("[Web FCM] تهيئة FCM للويب...");

    // تسجيل SW
    const swReg = await registerServiceWorker();
    if (!swReg) return;

    // استيراد Firebase ديناميكيًا (تحميل السكربتات العالمية)
    // ملاحظة: إصدارات v8 UMD تقوم بتعيين المتغير العام 'firebase' عند تحميلها ولا تدعم التصدير عبر ES Modules بشكل قياسي.
    if (!window.firebase) {
        await import("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
        await import("https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js");
    }

    const firebase = window.firebase;
    if (!firebase) {
        console.error("[FCM] فشل تحميل مكتبة Firebase.");
        return;
    }

    // تكوين Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyClapclT8_4UlPvM026gmZbYCiXaiBDUYk",
        authDomain: "suze-bazaar-notifications.firebaseapp.com",
        projectId: "suze-bazaar-notifications",
        storageBucket: "suze-bazaar-notifications.firebasestorage.app",
        messagingSenderId: "983537000435",
        appId: "1:983537000435:web:92c2729c9aaf872764bc86",
        measurementId: "G-P8FMC3KR7M",
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const messaging = firebase.messaging();

    // استقبال إشعار foreground
    messaging.onMessage((payload) => {
        console.log('%c[FCM Web] 🔔 تم استقبال رسالة أثناء التصفح (Foreground):', 'color: #00e676; font-weight: bold; font-size: 14px;', payload);
        console.log('[FCM Web] تفاصيل الرسالة:', JSON.stringify(payload, null, 2));

        // البيانات قد تكون في notification أو data حسب نوع الرسالة
        const data = payload.notification || payload.data || {};

        Swal.fire({
            icon: "info",
            title: data.title,
            text: data.body,
            confirmButtonText: "موافق",
        });

        if (typeof addNotificationLog === "function") {
            addNotificationLog({
                messageId: payload.messageId || `web_${Date.now()}`,
                type: "received",
                title: data.title,
                body: data.body,
                timestamp: new Date(),
                status: "unread",
                relatedUser: { key: "admin", name: "الإدارة" },
                payload: payload.data, // الاحتفاظ بالبيانات الخام
            });
        }
    });

    // طلب الإذن
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        console.warn("[FCM] المستخدم رفض الإذن.");
        return;
    }

    let savedToken = localStorage.getItem("fcm_token");

    if (!savedToken) {
        console.log("[FCM Web] لا يوجد توكن — طلب توكن جديد...");

        try {
            const newToken = await messaging.getToken({
                vapidKey: "BK1_lxS32198GdKm0Gf89yk1eEGcKvKLu9bn1sg9DhO8_eUUhRCAW5tjynKGRq4igNhvdSaR0-eL74V3ACl3AIY"
            });

            if (newToken) {
                localStorage.setItem("fcm_token", newToken);
                console.log("[FCM Web] تم الحصول على توكن جديد:", newToken);

                await sendTokenToServer(userSession.user_key, newToken, "web");
            }

        } catch (err) {
            console.error("[FCM Web] خطأ أثناء طلب التوكن:", err);
        }

    } else {
        console.log("[FCM Web] التوكن موجود محليًا — لا حاجة لإعادة الإرسال.");
    }
}



// ===============================
//   Utility: Wait for Android Token
// ===============================

/**
 * @description تنتظر حتى يتم حفظ `android_fcm_key` في `localStorage` ثم تستدعي دالة رد الاتصال (callback).
 * @function waitForFcmKey
 * @param {function(string): void} callback - الدالة التي سيتم استدعاؤها مع مفتاح FCM بمجرد توفره.
 * @param {number} timeout - الوقت المحدد (في الميلي ثانية) قبل إلغاء الانتظار.
 * @returns {Promise<string>} - وعد (Promise) يُرجع مفتاح FCM بمجرد توفره.
 * @throws {Error} - في حالة انتهاء الوقت المحدد أو في حالة عدم وجود مفتاح FCM.
 */
function waitForFcmKey(callback, timeout = 15000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();

        const check = () => {
            const token = localStorage.getItem("android_fcm_key");

            if (token) {
                callback(token);
                return resolve(token);
            }

            if (Date.now() - start >= timeout) {
                console.warn("[Android FCM] انتهى الوقت — لم يصل التوكن.");
                return reject("timeout");
            }

            setTimeout(check, 300);
        };

        check();
    });
}
