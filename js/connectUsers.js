/**
 * @file js/connectUsers.js
 * @description طبقة الاتصال بالواجهة البرمجية (API) الخاصة بالمستخدمين.
 *
 * هذا الملف يحتوي على مجموعة من الدوال غير المتزامنة (async functions) التي تسهل
 * التعامل مع بيانات المستخدمين، بما في ذلك جلبهم، إضافتهم، تحديثهم، حذفهم، والتحقق منهم.
 * يعتمد على متغير `baseURL` العام الذي يجب تعريفه في `js/config.js`.
 */

/**
 * يجلب قائمة بجميع المستخدمين من قاعدة البيانات.
 * تُستخدم هذه الدالة عادةً في لوحات تحكم المسؤولين.
 * @async
 * @returns {Promise<Array|null>} مصفوفة تحتوي على كائنات المستخدمين، أو `null` في حالة حدوث خطأ.
 */
async function fetchUsers() {
  console.log("%c[API] Starting fetchUsers...", "color: blue;");
  try {
    // إرسال طلب GET إلى نقطة النهاية الخاصة بالمستخدمين.
    const response = await fetch(`${baseURL}/api/users`);

    // إذا لم يكن الطلب ناجحًا، قم بإلقاء خطأ لمعالجته في كتلة catch.
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // تحويل الاستجابة إلى JSON وإرجاع البيانات.
    const data = await response.json();
    console.log("%c[API] fetchUsers successful.", "color: green;", data);
    return data;
  } catch (error) {
    // تسجيل أي خطأ يحدث أثناء الاتصال بالشبكة وإرجاع `null`.
    console.error("%c[API] fetchUsers failed:", "color: red;", error);
    return null;
  }
}

/**
 * يضيف مستخدمًا جديدًا إلى قاعدة البيانات.
 * @async
 * @param {object} userData - بيانات المستخدم المراد إضافته.
 * @param {string} userData.username - اسم المستخدم.
 * @param {string} userData.phone - رقم هاتف المستخدم.
 * @param {string} [userData.password] - كلمة المرور (اختياري).
 * @param {string} [userData.address] - العنوان (اختياري).
 * @param {string} userData.user_key - الرقم التسلسلي الفريد للمستخدم.
 * @returns {Promise<Object>} الكائن الذي تم إنشاؤه، أو كائن خطأ في حالة الفشل.
 */
async function addUser(userData) {
  console.log("%c[API] Starting addUser with data:", "color: blue;", userData);
  try {
    // إرسال طلب POST لإنشاء مستخدم جديد.
    const response = await fetch(`${baseURL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    // إذا لم يكن الطلب ناجحًا، أرجع كائن خطأ يحتوي على رسالة من الخادم.
    if (!response.ok) {
      return { error: data.error || `HTTP error! status: ${response.status}` };
    }

    console.log("%c[API] addUser successful.", "color: green;", data);
    return data;
  } catch (error) {
    console.error("%c[API] addUser failed:", "color: red;", error);
    // إرجاع كائن خطأ عام في حالة فشل الاتصال بالشبكة.
    return { error: "فشل الاتصال بالخادم." };
  }
}

/**
 * يحدث بيانات مستخدم واحد موجود في قاعدة البيانات.
 * @async
 * @param {object} userData - بيانات المستخدم للتحديث (يجب أن تحتوي على user_key).
 * @returns {Promise<Object>} الكائن الذي تم تحديثه، أو كائن خطأ في حالة الفشل.
 */
async function updateUser(userData) {
  console.log(
    "%c[API] Starting updateUser with data:",
    "color: blue;",
    userData
  );
  try {
    // استخدام طريقة PUT لتحديث بيانات موجودة.
    const response = await fetch(`${baseURL}/api/users`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    // معالجة الأخطاء.
    if (!response.ok) {
      return { error: data.error || `HTTP error! status: ${response.status}` };
    }

    console.log("%c[API] updateUser successful.", "color: green;", data);
    return data;
  } catch (error) {
    console.error("%c[API] updateUser failed:", "color: red;", error);
    return { error: "فشل الاتصال بالخادم." };
  }
}
/**
 * يجلب بيانات مستخدم واحد بناءً على رقم هاتفه.
 * تُستخدم هذه الدالة بشكل أساسي عند تسجيل الدخول للتحقق من وجود المستخدم.
 * @async
 * @param {string} phone - رقم هاتف المستخدم للبحث عنه.
 * @returns {Promise<Object|null>} كائن يحتوي على بيانات المستخدم، أو `null` إذا لم يتم العثور عليه أو في حالة حدوث خطأ.
 */
async function getUserByPhone(phone) {
  console.log(
    `%c[API] Starting getUserByPhone for phone: ${phone}`,
    "color: blue;"
  );
  try {
    // بناء الرابط مع تمرير رقم الهاتف كمعامل استعلام (Query Parameter).
    const response = await fetch(`${baseURL}/api/users?phone=${phone}`);

    // إذا كان المستخدم غير موجود (استجابة 404)، لا يعتبر هذا خطأ فادحًا، بل يعني أن الرقم غير مسجل.
    if (response.status === 404) {
      console.warn("[API] getUserByPhone: User not found (404).");
      return null;
    }

    // معالجة الأخطاء الأخرى (مثل أخطاء الخادم 500).
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // تحويل الاستجابة إلى JSON وإرجاع بيانات المستخدم.
    const data = await response.json();
    console.log("%c[API] getUserByPhone successful.", "color: green;", data);
    return data;
  } catch (error) {
    console.error("%c[API] getUserByPhone failed:", "color: red;", error);
    return null;
  }
}

/**
 * يحدث بيانات عدة مستخدمين دفعة واحدة.
 * تُستخدم هذه الدالة في لوحة تحكم المسؤول لتغيير أدوار عدة مستخدمين (مثلاً، ترقيتهم إلى بائعين).
 * @async
 * @param {Array<Object>} updates - مصفوفة من الكائنات تحتوي على بيانات التحديث.
 * @returns {Promise<Object>} كائن الاستجابة من الخادم، أو كائن خطأ في حالة الفشل.
 */
async function updateUsers(updates) {
  console.log(
    "%c[API] Starting updateUsers with data:",
    "color: blue;",
    updates
  );
  try {
    // استخدام طريقة PUT وتمرير مصفوفة التحديثات في الجسم.
    const response = await fetch(`${baseURL}/api/users`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    // معالجة الأخطاء.
    if (!response.ok) {
      return { error: data.error || `HTTP error! status: ${response.status}` };
    }

    console.log("%c[API] updateUsers successful.", "color: green;", data);
    return data;
  } catch (error) {
    console.error("%c[API] updateUsers failed:", "color: red;", error);
    return { error: "فشل الاتصال بالخادم." };
  }
}

/**
 * يتحقق من صحة كلمة المرور لمستخدم معين.
 * @async
 * @param {string} phone - رقم هاتف المستخدم.
 * @param {string} password - كلمة المرور للتحقق منها.
 * @returns {Promise<Object>} كائن بيانات المستخدم عند النجاح، أو كائن خطأ عند الفشل.
 */
async function verifyUserPassword(phone, password) {
  console.log(
    `%c[API] Starting verifyUserPassword for phone: ${phone}`,
    "color: blue;"
  );
  try {
    // إرسال طلب POST مع "action" خاص للتمييز بين عملية الإنشاء وعملية التحقق.
    const response = await fetch(`${baseURL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", phone, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      // إذا كان هناك خطأ، استخدم رسالة الخطأ من الخادم
      return { error: data.error || `HTTP error! status: ${response.status}` };
    }

    console.log(
      "%c[API] verifyUserPassword successful.",
      "color: green;",
      data
    );
    return data;
  } catch (error) {
    console.error("%c[API] verifyUserPassword failed:", "color: red;", error);
    return { error: "فشل الاتصال بالخادم." };
  }
}

/**
 * يحذف مستخدمًا بشكل نهائي من قاعدة البيانات.
 * @async
 * @param {string} userKey - المفتاح الفريد للمستخدم المراد حذفه.
 * @returns {Promise<Object>} كائن الاستجابة من الخادم.
 */
async function deleteUser(userKey) {
  console.log(
    `%c[API] Starting deleteUser for user_key: ${userKey}`,
    "color: #e74c3c; font-weight: bold;"
  );
  try {
    // استخدام طريقة DELETE وتمرير مفتاح المستخدم في الجسم.
    const response = await fetch(`${baseURL}/api/users`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_key: userKey }),
    });

    const data = await response.json();

    // معالجة الأخطاء.
    if (!response.ok) {
      return { error: data.error || `HTTP error! status: ${response.status}` };
    }

    console.log("%c[API] deleteUser successful.", "color: green;", data);
    return data;
  } catch (error) {
    console.error("%c[API] deleteUser failed:", "color: red;", error);
    return { error: "فشل الاتصال بالخادم عند حذف المستخدم." };
  }
}
