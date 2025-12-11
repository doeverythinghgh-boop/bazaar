/**
 * @file main.js
 * @description نقطة دخول التطبيق (Entry Point).
 * هذا الملف هو العقل المدبر للتطبيق، حيث يبدأ التنفيذ منه.
 * يقوم بتنسيق عملية التحميل الأولية:
 * 1. جلب البيانات (Control & Orders).
 * 2. تحديد هوية المستخدم ونوعه.
 * 3. تحديد الحالة الأولية للتطبيق (الخطوة الحالية).
 * 4. ربط معالجات الأحداث (Event Listeners).
 */

import { fetchControlData, fetchOrdersData } from "./dataFetchers.js";
import {
    determineUserType,
    determineCurrentStepId,
} from "./roleAndStepDetermination.js";
import { initializeState } from "./stateManagement.js";
import { updateCurrentStepFromState } from "./uiUpdates.js";
import { addStepClickListeners } from "./stepClickHandlers.js"; import { initializationPromise } from "./config.js";

/**
 * @event DOMContentLoaded
 * @description يتم تنفيذ هذا الكود بمجرد تحميل هيكل الصفحة (DOM) بالكامل.
 * يضمن هذا أن جميع العناصر التي سنحاول الوصول إليها موجودة بالفعل.
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 [Main] DOMContentLoaded: Page loaded. Starting application initialization.");

    // أولاً، انتظر اكتمال التهيئة من الصفحة الأم
    initializationPromise.then(() => {
        /**
         * @description جلب جميع البيانات اللازمة بشكل متزامن (Parallel Fetching).
         * نستخدم Promise.all لانتظار اكتمال كلا الطلبين قبل المتابعة.
         * هذا يحسن الأداء مقارنة بانتظار كل طلب على حدة.
         */
        console.log("  [Main] Fetching initial data (control & orders)...");
        Promise.all([fetchControlData(), fetchOrdersData()])
            .then(([controlData, ordersData]) => {
                console.log("✅ [Main] Initial data fetched successfully.", { controlData, ordersData });
                try {
                    // --- مرحلة التهيئة (Initialization Phase) ---
                    console.log("  [Main] Initializing application state...");
                    initializeState();

                    // 1. استخراج معرف المستخدم من البيانات
                    const userId = controlData.currentUser.idUser;
                    console.log(`  [Main] Current User ID: ${userId}`);

                    // 2. تحديد نوع المستخدم (Admin, Buyer, Seller, Courier)
                    const userType = determineUserType(userId, ordersData, controlData);

                    // إذا لم يتم تحديد نوع المستخدم (مثلاً بيانات غير متناسقة)، أوقف التنفيذ
                    if (!userType) {
                        console.error("Failed to determine user type. Aborting initialization.");
                        console.error("❌ [Main] Failed to determine user type. Aborting initialization.");
                        return;
                    }

                    // 3. حساب حالة قفل التعديل للمشتري
                    console.log("  [Main] Calculating buyer modification lock state...");
                    // إذا تجاوزنا مرحلة الشحن، لا ينبغي للمشتري تعديل طلباته
                    const currentStepNo = parseInt(
                        determineCurrentStepId(controlData).stepNo
                    );
                    const shippedStepNo = parseInt(
                        controlData.steps.find((step) => step.id === "step-shipped")?.no || 0
                    );
                    const isBuyerReviewModificationLocked = currentStepNo >= shippedStepNo;
                    console.log(`    [Main] Buyer modification lock state: ${isBuyerReviewModificationLocked}`);

                    // 4. تحديث كائن المستخدم بالنوع المحدد
                    controlData.currentUser.type = userType;

                    // 5. عرض معلومات المستخدم في عنوان المتصفح
                    const originalTitle = document.title;
                    document.title = `[${userType}: ${userId}] - ${originalTitle}`;

                    console.log(`✅ [Main] User type determined as: ${userType}`);

                    // 6. تحديث الواجهة لتعكس الخطوة الحالية
                    console.log("  [Main] Performing initial UI update...");
                    updateCurrentStepFromState(controlData, ordersData);

                    // 7. تفعيل التفاعل: إضافة مستمعي النقرات للخطوات
                    console.log("  [Main] Adding click listeners to stepper items...");
                    addStepClickListeners(
                        controlData,
                        ordersData,
                        isBuyerReviewModificationLocked
                    );

                    // 8. بدء عملية الاستطلاع (Polling) للتحديثات
                    console.log("  [Main] Starting polling for updates...");
                    startPollingForUpdates(controlData, ordersData, userId);

                    console.log("🎉 [Main] Application initialized successfully!");
                } catch (initializationError) {
                    console.error(
                        "❌ [Main] Error during initialization process (inside .then):",
                        initializationError
                    );
                }
            })
            .catch((error) =>
                console.error("❌ [Main] Critical error fetching initial data (Promise.catch):", error)
            );
    });
});

/**
 * @function startPollingForUpdates
 * @description آلية المزامنة الدورية للتحقق من وجود تحديثات على حالة الطلب من السيرفر.
 * تقوم هذه الدالة بفحص المجلد الأب (window.parent) أو API إذا توفرت للحصول على آخر البيانات وتحديث الواجهة.
 */
function startPollingForUpdates(controlData, ordersData, userId) {
    if (!ordersData || ordersData.length === 0) return;

    // فترة التحديث (مثلاً كل 5 ثواني)
    const POLL_INTERVAL = 5000;

    setInterval(() => {
        // بدلاً من طلب API حقيقي هنا (لأن الهيكل الحالي يعتمد على window.parent data injection)،
        // سنحاول إعادة قراءة البيانات من النافذة الأم إذا كانت متاحة، أو محاكاة جلب التحديث.

        // ملاحظة: في بيئة إنتاج حقيقية، يجب استدعاء API: fetch('/api/orders/status?id=...')

        if (window.parent && window.parent.globalStepperAppData) {
            const serverState = window.parent.globalStepperAppData;

            // قراءة الحالة المحلية الحالية للمقارنة
            const localState = JSON.parse(localStorage.getItem(`stepper_app_data_${ordersData[0].order_key}`)) || {};

            // مقارنة بسيطة: هل تغير شيء؟
            // (للمقارنة الدقيقة يفضل استخدام JSON.stringify أو فحص timestamps)
            if (JSON.stringify(serverState) !== JSON.stringify(localState)) {
                console.log("🔄 [Polling] Detected update from server/parent. Refreshing UI...");

                // تحديث الحالة المحلية
                // ملاحظة: هنا يجب الحذر من الكتابة فوق تغييرات المستخدم المحلي إذا كان هو من يقوم بالتعديل حالياً.
                // لكن بما أن هذه النسخة للمشتري (للعرض غالباً عند انتظار الشحن)، فالتحديث من السيرفر له الأولوية.
                import('./stateManagement.js').then(module => {
                    // نحفظ الحالة الجديدة
                    // ملاحظة: نستخدم دالة saveAppState للتأكد من التناسق لكن بحذر من الدوران،
                    // هنا نحدث الـ localStorage مباشرة لتفادي loop إذا كانت saveAppState تستدعي تحديث السيرفر
                    // ولكن بما أننا في "استقبال"، التحديث المباشر آمن.
                    localStorage.setItem(`stepper_app_data_${ordersData[0].order_key}`, JSON.stringify(serverState));

                    // إعادة تحميل الصفحة أو تحديث الواجهة
                    // الأسهل لضمان التناسق هو تحديث الخطوات
                    import('./uiUpdates.js').then(uiModule => {
                        uiModule.updateCurrentStepFromState(controlData, ordersData);
                    });

                    // تحديث المتغير العام
                    import('./config.js').then(configModule => {
                        configModule.updateGlobalStepperAppData(serverState);
                    });
                });
            }
        }
    }, POLL_INTERVAL);
}
