/**
 * @file js/notification-db-manager.js
 * @module notification-db-manager
 * @description Manages the application's IndexedDB database for notifications.
 */

/**
 * The name of the application's IndexedDB database.
 * @type {string}
 * @const
 */
const DB_NAME = 'bazaarAppDB';
/**
 * The version of the IndexedDB database. Increment to trigger `onupgradeneeded`.
 * @type {number}
 * @const
 */
const DB_VERSION = 3; // ✅ إصلاح نهائي: زيادة الإصدار لإجبار المتصفح على تشغيل onupgradeneeded
/**
 * The name of the object store for notification logs within the database.
 * @type {string}
 * @const
 */
const NOTIFICATIONS_STORE = 'notificationsLog';

/** @type {IDBDatabase | null} */
let db;
/**
 * A promise that resolves with the database connection, to prevent multiple initialization attempts.
 * @type {Promise<IDBDatabase>|null}
 */
let dbPromise; // ✅ جديد: متغير لتخزين الوعد الخاص بتهيئة قاعدة البيانات

/**
 * Opens or creates the IndexedDB database and initializes the necessary object stores.
 * This function uses a singleton pattern to ensure the database is initialized only once.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the IDBDatabase object on success.
 * @throws {string} An error message if the database fails to open.
 * @see DB_NAME
 * @see DB_VERSION
 * @see NOTIFICATIONS_STORE
 */
export async function initDB() {
  // ✅ إصلاح: إذا كان هناك وعد قائم بالفعل، قم بإرجاعه مباشرة لمنع السباق الزمني.
  if (dbPromise) {
    return dbPromise;
  }

  // ✅ إصلاح: إنشاء وعد جديد وتخزينه
  dbPromise = new Promise((resolve, reject) => {
    // ✅ إصلاح: التحقق من وجود `db` هنا يضمن عدم إعادة فتح اتصال موجود.
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('[DB] خطأ في فتح قاعدة البيانات:', event.target.error);
      reject('Failed to open database.');
    };

    request.onupgradeneeded = (event) => {
      const tempDb = event.target.result;
      console.log('[DB] جاري ترقية/إنشاء قاعدة البيانات...');

      // This code only runs when the database is created for the first time or when the version number is increased.
      if (!tempDb.objectStoreNames.contains(NOTIFICATIONS_STORE)) {
        console.log(`[DB] جاري إنشاء مخزن الكائنات: ${NOTIFICATIONS_STORE}`);
        const store = tempDb.createObjectStore(NOTIFICATIONS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        // Create all required indexes at once
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('messageId', 'messageId', { unique: true });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('[DB] تم فتح قاعدة البيانات بنجاح.');
      resolve(db);
    };
  });

  return dbPromise;
}

/**
 * Adds a new record to the notification store, checking for duplicates for 'received' notifications.
 * Dispatches a custom event (`notificationLogAdded`) after successful addition.
 * @param {object} notificationData - The notification data object to add.
 * @returns {Promise<number>} A promise that resolves with the new record's key (`id`).
 * @throws {string} An error message if adding the record fails.
 * @see initDB
 * @see NOTIFICATIONS_STORE
 */
export async function addNotificationLog(notificationData) {
  // ✅ إصلاح: انتظر دائمًا اكتمال تهيئة قاعدة البيانات قبل أي عملية.
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTIFICATIONS_STORE], 'readwrite');
    const store = transaction.objectStore(NOTIFICATIONS_STORE);

    // Check for duplicates within the same transaction
    if (notificationData.messageId && notificationData.type === 'received') {
      const index = store.index('messageId');
      const requestCheck = index.get(notificationData.messageId);

      requestCheck.onsuccess = () => {
        if (requestCheck.result) {
          // الإشعار موجود بالفعل، لا تقم بإضافته مرة أخرى
          console.warn(`[DB] تم تجاهل حفظ الإشعار المكرر (messageId: ${notificationData.messageId})`);
          resolve(requestCheck.result.id); // إرجاع مفتاح السجل الموجود
        } else {
          // الإشعار غير موجود، قم بإضافته
          addRecord(store, notificationData, resolve, reject);
        }
      };
      requestCheck.onerror = (event) => {
        console.error('[DB] خطأ أثناء التحقق من تكرار الإشعار:', event.target.error);
        // في حالة حدوث خطأ، استمر في محاولة الإضافة كحل بديل
        addRecord(store, notificationData, resolve, reject);
      };
    } else {
      // إذا لم يكن هناك messageId، أضف السجل مباشرة
      addRecord(store, notificationData, resolve, reject);
    }
  });
}

/**
 * @description دالة مساعدة داخلية لإضافة سجل إشعار فعلي إلى مخزن الكائنات `NOTIFICATIONS_STORE` في IndexedDB.
 *   Dispatches a `notificationLogAdded` custom event upon success.
 * @param {IDBObjectStore} store - The IndexedDB object store.
 * @param {object} notificationData - The notification data to add.
 * @param {function(number): void} resolve - The resolve function of the wrapping promise.
 * @param {function(string): void} reject - The reject function of the wrapping promise.
 * @see addNotificationLog
 */
function addRecord(store, notificationData, resolve, reject) {
  const request = store.add(notificationData);

  request.onsuccess = () => {
    console.log('[DB] تم إضافة سجل إشعار بنجاح:', notificationData.type);
    // Dispatch a custom event to notify the app of a new log.
    // This allows open UIs (like a notification log window) to update immediately.
    const newLogEvent = new CustomEvent('notificationLogAdded', {
      // Pass the notification data along with the new ID generated by IndexedDB.
      detail: { ...notificationData, id: request.result },
    });
    window.dispatchEvent(newLogEvent);
    resolve(request.result);
  };

  request.onerror = (event) => {
    console.error('[DB] فشل إضافة سجل إشعار:', event.target.error);
    reject('Failed to add record.');
  };
}

/**
 * Fetches notification logs from IndexedDB, with optional filtering by type and a limit.
 * Records are fetched in reverse chronological order (newest first).
 * @param {'sent' | 'received' | 'all'} [type='all'] - The type of notifications to fetch.
 * @param {number} [limit=50] - The maximum number of records to fetch.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of notification log objects.
 * @throws {string} An error message if fetching records fails.
 * @see initDB
 * @see NOTIFICATIONS_STORE
 */
export async function getNotificationLogs(type = 'all', limit = 50) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTIFICATIONS_STORE], 'readonly');
    const store = transaction.objectStore(NOTIFICATIONS_STORE);
    const index = store.index('timestamp'); // Use the timestamp index for sorting
    const results = [];

    // فتح مؤشر للتحرك عبر السجلات بترتيب عكسي (الأحدث أولاً)
    const cursorRequest = index.openCursor(null, 'prev');
    let count = 0;

    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor && count < limit) {
        const record = cursor.value;
        if (type === 'all' || record.type === type) {
          results.push(record);
          count++;
        }
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    cursorRequest.onerror = (event) => {
      console.error('[DB] فشل جلب سجلات الإشعارات:', event.target.error);
      reject('Failed to fetch records.');
    };
  });
}

/**
 * Clears all records from the notification store in IndexedDB.
 * @returns {Promise<void>} A promise that resolves when all records have been cleared.
 * @throws {string} An error message if the clear operation fails.
 * @see initDB
 * @see NOTIFICATIONS_STORE
 */
export async function clearNotificationLogs() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTIFICATIONS_STORE], 'readwrite');
    const store = transaction.objectStore(NOTIFICATIONS_STORE);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('[DB] تم مسح جميع سجلات الإشعارات بنجاح.');
      resolve();
    };

    request.onerror = (event) => {
      console.error('[DB] فشل مسح سجلات الإشعارات:', event.target.error);
      reject('Failed to clear records.');
    };
  });
}