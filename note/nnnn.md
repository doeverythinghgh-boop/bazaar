اسم الدالة	الملف	الوظيفة
handler	api/send-notification.js	
نقطة نهاية API (Serverless) لإرسال إشعارات Push عبر Firebase Admin SDK، تتعامل مع طلبات POST.

handler	api/tokens.js	
نقطة نهاية API لإدارة التوكنات (حفظ، تحديث، حذف) في جدول user_tokens.

setupFCM	js/auth.js	
تهيئة Firebase، تسجيل Service Worker، وطلب إذن الإشعارات من المستخدم.

sendTokenToServer	js/auth.js	
دالة مساعدة داخلية لإرسال توكن FCM المستخرج إلى الخادم لحفظه في قاعدة البيانات.

initializeNotifications	js/auth.js	
الدالة الرئيسية لتهيئة الإشعارات، تتحقق من أهلية المستخدم وتستدعي setupFCM.

isUserEligibleForNotifications	js/auth.js	
تتحقق مما إذا كان المستخدم (بائع، مسؤول، توصيل) يمتلك صلاحية استلام الإشعارات.

handleRevokedPermissions	js/auth.js	
تعالج حالة قيام المستخدم بإلغاء إذن الإشعارات من المتصفح وتحذف التوكن من الخادم.

waitForFcmKey	js/auth.js	
تنتظر توكن FCM القادم من تطبيق الأندرويد (Native Wrapper) وتخزينه محليًا.

saveNotificationFromAndroid	js/auth.js	
تستلم بيانات الإشعار من كود الأندرويد الأصلي وتحفظها في قاعدة البيانات المحلية (IndexedDB).

messaging.onBackgroundMessage	firebase-messaging-sw.js	
تستمع للإشعارات الواردة عندما يكون التطبيق مغلقًا أو في الخلفية وتعرضها.

sendNotification	js/connect1.js	
دالة الواجهة الأمامية (Frontend) التي تقوم بعمل طلب POST لـ API الإرسال.

sendNotificationsToTokens	js/helpers/network.js	
ترسل إشعارًا واحدًا إلى مصفوفة من التوكنات بالتوازي (Batch Sending).

getAdminTokens	js/helpers/network.js	
تجلب توكنات جميع المسؤولين لإرسال إشعارات إدارية لهم.

getTokensForActiveDelivery2Seller	js/helpers/network.js	
تجلب توكنات موزعي التوصيل النشطين المرتبطين ببائع معين.

getUsersTokens	js/helpers/network.js	
تجلب توكنات FCM لمجموعة محددة من المستخدمين عبر user_key.

sendUpdateNotifications	js/reports-modal.js	
ترسل إشعارات تلقائية عند تغيير حالة الطلب (تأكيد، شحن، توصيل) للأطراف المعنية.

checkAndDisplayNotificationStatus	js/admin-page.js	
تتحقق من حالة إذن الإشعارات في المتصفح وتعرض حالة التفعيل للمسؤول في لوحة التحكم.

*****************************************************************

اسم الدالة	الملف	الوظيفة
initDB	js/notification-db-manager.js	
تفتح أو تنشئ قاعدة بيانات IndexedDB المحلية لتخزين سجلات الإشعارات.

addNotificationLog	js/notification-db-manager.js	
تضيف سجلاً جديدًا للإشعار (صادر أو وارد) في قاعدة البيانات المحلية.

getNotificationLogs	js/notification-db-manager.js	
تجلب سجلات الإشعارات المخزنة لعرضها للمستخدم، مرتبة زمنيًا.

clearNotificationLogs	js/notification-db-manager.js	
تمسح كافة سجلات الإشعارات من قاعدة البيانات المحلية.

showNotificationsLogModal	js/notifications-log-modal.js	
تعرض نافذة منبثقة (Modal) تحتوي على سجل الإشعارات وتحدثها في الوقت الفعلي.

******************************************************************