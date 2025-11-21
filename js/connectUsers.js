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
  try {
    const data = await apiFetch('/api/users');
    return data.error ? null : data;
  } catch (error) {
    console.error("%c[fetchUsers] failed:", "color: red;", error);
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
  return await apiFetch('/api/users', {
    method: 'POST',
    body: userData,
  });
}

/**
 * يحدث بيانات مستخدم واحد موجود في قاعدة البيانات.
 * @async
 * @param {object} userData - بيانات المستخدم للتحديث (يجب أن تحتوي على user_key).
 * @returns {Promise<Object>} الكائن الذي تم تحديثه، أو كائن خطأ في حالة الفشل.
 */
async function updateUser(userData) {
  return await apiFetch('/api/users', {
    method: 'PUT',
    body: userData,
  });
}
/**
 * يجلب بيانات مستخدم واحد بناءً على رقم هاتفه.
 * تُستخدم هذه الدالة بشكل أساسي عند تسجيل الدخول للتحقق من وجود المستخدم.
 * @async
 * @param {string} phone - رقم هاتف المستخدم للبحث عنه.
 * @returns {Promise<Object|null>} كائن يحتوي على بيانات المستخدم، أو `null` إذا لم يتم العثور عليه أو في حالة حدوث خطأ.
 */
async function getUserByPhone(phone) {
  try {
    const data = await apiFetch(`/api/users?phone=${phone}`, {
      specialHandlers: {
        404: () => {
          console.warn("[API] getUserByPhone: User not found (404).");
          return null;
        }
      }
    });
    return data;
  } catch (error) {
    console.error("%c[getUserByPhone] failed:", "color: red;", error);
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
  return await apiFetch('/api/users', {
    method: 'PUT',
    body: updates,
  });
}

/**
 * يتحقق من صحة كلمة المرور لمستخدم معين.
 * @async
 * @param {string} phone - رقم هاتف المستخدم.
 * @param {string} password - كلمة المرور للتحقق منها.
 * @returns {Promise<Object>} كائن بيانات المستخدم عند النجاح، أو كائن خطأ عند الفشل.
 */
async function verifyUserPassword(phone, password) {
  return await apiFetch('/api/users', {
    method: 'POST',
    body: { action: 'verify', phone, password },
  });
}

/**
 * يحذف مستخدمًا بشكل نهائي من قاعدة البيانات.
 * @async
 * @param {string} userKey - المفتاح الفريد للمستخدم المراد حذفه.
 * @returns {Promise<Object>} كائن الاستجابة من الخادم.
 */
async function deleteUser(userKey) {
  return await apiFetch('/api/users', {
    method: 'DELETE',
    body: { user_key: userKey },
  });
}
