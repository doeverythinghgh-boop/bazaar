/**
 * @file js/users-admin-modal.js
 * @description موديول مستقل لعرض وإدارة المستخدمين في لوحة تحكم المسؤول.
 */

/**
 * @description يعرض نافذة منبثقة (Modal) لإدارة المستخدمين.
 *   يقوم بتحميل قالب إدارة المستخدمين من `pages/usersAdminModal.html`
 *   ويهيئ المنطق الخاص بإدارة المستخدمين عند الفتح.
 * @function showUsersAdminModal
 * @returns {Promise<void>} - وعد (Promise) لا يُرجع قيمة عند الاكتمال.
 * @see loadAndShowModal
 * @see initializeUsersAdminLogic
 */
async function showUsersAdminModal() {
  await loadAndShowModal(
    "users-modal-container",
    "pages/usersAdminModal.html",
    initializeUsersAdminLogic
  );
}

/**
 * @description يهيئ منطق العمل داخل نافذة إدارة المستخدمين،
 *   بما في ذلك جلب المستخدمين وعرضهم، وتفعيل فلاتر البحث والدور،
 *   وإدارة تحديثات أدوار المستخدمين، وإرسال إشعارات لهم.
 * @function initializeUsersAdminLogic
 * @param {HTMLElement} modalContainer - حاوية النافذة المنبثقة.
 * @returns {Promise<void>} - وعد (Promise) لا يُرجع قيمة عند الاكتمال.
 * @see fetchUsers
 * @see generateUserCardHTML
 * @see sendNotification
 * @see addNotificationLog
 * @see updateUsers
 */
async function initializeUsersAdminLogic(modalContainer) {
  const contentWrapper = modalContainer.querySelector("#users-admin-modal-content-wrapper");
  const actionsContainer = modalContainer.querySelector("#users-admin-modal-actions");
  const searchInput = modalContainer.querySelector("#users-admin-search-input");
  const roleFilterContainer = modalContainer.querySelector(".user-role-filter-container");
  let allUsers = []; // لتخزين جميع المستخدمين للبحث

  /**
   * @description تعرض قائمة بالمستخدمين في الواجهة على شكل بطاقات.
   *   تُخفي حاوية الإجراءات إذا لم يكن هناك مستخدمين.
   * @function displayUsers
   * @param {Array<Object>} users - مصفوفة من كائنات المستخدمين المراد عرضها.
   * @returns {void}
   * @see generateUserCardHTML
   */
  const displayUsers = (users) => {
    actionsContainer.style.display = 'none';
    if (users && users.length > 0) {
      let usersHTML = '<div class="user-cards-container">';
      users.forEach(u => { 
        // ✅ تعديل: تمرير قائمة جميع المستخدمين لتحديد الموزعين
        usersHTML += generateUserCardHTML(u, allUsers); 
      });
      usersHTML += `</div>`;
      contentWrapper.innerHTML = usersHTML;
    } else {
      contentWrapper.innerHTML = "<p>لم يتم العثور على مستخدمين.</p>";
    }
  };

  // تحميل المستخدمين لأول مرة
  contentWrapper.innerHTML = '<div class="loader"></div>';
  allUsers = await fetchUsers();
  displayUsers(allUsers);

  /**
   * @description تقوم بتصفية قائمة المستخدمين المعروضة بناءً على نص البحث والدور المحدد.
   *   تُحدّث عرض المستخدمين في الواجهة.
   * @function applyFilters
   * @returns {void}
   * @see displayUsers
   */
  const applyFilters = () => {
    console.log("%c[Users Admin] بدء عملية تصفية المستخدمين...", "color: blue;");
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedRole = roleFilterContainer.querySelector('input[name="user-role-filter"]:checked').value;
    console.log(`[Users Admin] معايير التصفية: نص البحث='${searchTerm}', الدور المحدد='${selectedRole}'`);

    if (!allUsers) {
      console.warn("[Users Admin] لا يوجد مستخدمين لعرضهم (allUsers is null).");
      return;
    }

    // ✅ إصلاح: تعديل منطق تصفية الأدوار ليعمل بشكل صحيح.
    // يتم تحويل قيمة الفلتر المحددة (selectedRole) إلى رقم للمقارنة.
    // إذا كانت القيمة فارغة (فلتر "الكل")، يتم تخطي التحقق من الدور.
    const filteredUsers = allUsers.filter(user => {
      const matchesSearch = (user.username && user.username.toLowerCase().includes(searchTerm)) ||
                            (user.phone && user.phone.includes(searchTerm));
      
      // إذا لم يتم تحديد دور (فلتر "الكل")، فإن matchesRole تكون true دائمًا.
      if (!selectedRole) {
        return matchesSearch;
      }

      // مقارنة دور المستخدم بالدور المحدد في الفلتر.
      const matchesRole = parseInt(user.is_seller, 10) === parseInt(selectedRole, 10);
      return matchesSearch && matchesRole;
    });

    displayUsers(filteredUsers);
    console.log("%c[Users Admin] انتهت عملية تصفية وعرض المستخدمين.", "color: green;");
  };

  // ربط الأحداث
  searchInput.addEventListener('input', applyFilters);
  roleFilterContainer.addEventListener('change', (event) => {
    // ✅ تتبع للمطور: تسجيل الحدث عند تغيير فلتر الدور
    if (event.target.name === 'user-role-filter') {
        console.log(`%c[Users Admin] تم النقر على فلتر الدور: ${event.target.labels[0].innerText}`, "color: purple; font-weight: bold;");
        applyFilters();
    }
  });
  // ربط الأحداث داخل النافذة المنبثقة
  // ✅ تعديل: استخدام contentWrapper لربط الأحداث لأنه يحتوي على البطاقات
  const modalBody = modalContainer.querySelector('.users-admin-modal-body');
  const modalContent = modalContainer.querySelector('.modal-content');
  const updateBtn = modalContainer.querySelector("#update-users-btn");
  const cancelBtn = modalContainer.querySelector("#cancel-update-btn");

  modalContent.addEventListener('change', (event) => {
    if (event.target.classList.contains('user-role-select')) {
      actionsContainer.style.display = 'flex';
    }
  });

  // ✅ تعديل: استخدام modalBody لربط الأحداث لأنه أب مستقر
  modalBody.addEventListener('click', async (event) => {
    const sendBtn = event.target.closest('.send-notif-btn');
    if (!sendBtn) return;

    const userKey = sendBtn.dataset.userKey;
    const token = sendBtn.dataset.token;
    const messageInput = document.getElementById(`notif-input-${userKey}`);
    const message = messageInput.value.trim();

    if (!message) {
      Swal.fire({
        title: 'خطأ',
        text: 'الرجاء كتابة رسالة قبل الإرسال.',
        icon: 'error',
        target: modalContainer,
      });
      return;
    }

    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    const result = await sendNotification(token, 'رسالة من الإدارة', message);
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';

    // ✅ جديد: تسجيل الإشعار المرسل في IndexedDB
    const recipientUser = allUsers.find(u => u.user_key === userKey);

    if (result && result.success) {
      Swal.fire({
        title: 'تم الإرسال',
        text: 'تم إرسال الإشعار بنجاح.',
        icon: 'success',
        target: modalContainer,
      });
      messageInput.value = '';
      if (typeof addNotificationLog === 'function' && recipientUser) {
        addNotificationLog({
          type: 'sent',
          title: 'رسالة من الإدارة',
          body: message,
          timestamp: new Date(),
          status: 'success',
          relatedUser: { key: recipientUser.user_key, name: recipientUser.username },
        });
      }
    } else {
      Swal.fire({
        title: 'فشل الإرسال',
        text: `حدث خطأ: ${result.error}`,
        icon: 'error',
        target: modalContainer,
      });
      if (typeof addNotificationLog === 'function' && recipientUser) {
        addNotificationLog({
          type: 'sent',
          title: 'رسالة من الإدارة',
          body: message,
          timestamp: new Date(),
          status: 'failed',
          relatedUser: { key: recipientUser.user_key, name: recipientUser.username },
          errorMessage: result.error,
        });
      }
    }
  });

  // ✅ جديد: ربط حدث النقر لمعالجة تغيير حالة الموزع
  modalBody.addEventListener('change', async (event) => {
    if (event.target.classList.contains('status-toggle-checkbox')) {
      await handleDeliveryStatusToggle(event.target);
    }
  });


  cancelBtn.addEventListener('click', () => {
    displayUsers(allUsers); // إعادة عرض جميع المستخدمين
  });

  updateBtn.addEventListener('click', async () => {
    const selects = modalContent.querySelectorAll('.user-role-select');
    const updates = [];
    
    selects.forEach(select => {
      const newRole = parseInt(select.value, 10);
      const originalState = parseInt(select.dataset.originalState, 10);
      if (newRole !== originalState) {
        updates.push({ phone: select.dataset.phone, is_seller: newRole });
      }
    });

    if (updates.length === 0) {
      actionsContainer.style.display = 'none';
      return;
    }

    const updateResult = await updateUsers(updates);
    if (updateResult && !updateResult.error) {
      Swal.fire({
        title: 'تم التحديث!',
        text: 'تم حفظ التغييرات بنجاح.',
        icon: 'success',
        target: modalContainer
      });
      // تحديث الحالة الأصلية في الواجهة لتجنب الحفظ المتكرر
      updates.forEach(upd => {
        const selectEl = modalContent.querySelector(`.user-role-select[data-phone="${upd.phone}"]`);
        if(selectEl) selectEl.dataset.originalState = upd.is_seller;
      });
      actionsContainer.style.display = 'none';
    } else {
      Swal.fire({
        title: 'خطأ!', text: 'فشل تحديث البيانات.', icon: 'error', target: modalContainer
      });
    }
  });
}

/**
 * @description يعالج حدث تغيير حالة ارتباط الموزع بالبائع.
 * @param {HTMLInputElement} checkbox - مربع الاختيار الذي تم النقر عليه.
 */
async function handleDeliveryStatusToggle(checkbox) {
  const sellerKey = checkbox.dataset.sellerKey;
  const deliveryKey = checkbox.dataset.deliveryKey;
  const isActive = checkbox.checked;

  checkbox.disabled = true; // تعطيل مربع الاختيار أثناء التحديث

  try {
    const response = await fetchWithAuth('/api/suppliers-deliveries', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellerKey, deliveryKey, isActive }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update status: ${response.statusText}`);
    }

    // تم التحديث بنجاح
    console.log(`[Delivery Toggle] Relation updated for seller ${sellerKey} and delivery ${deliveryKey} to ${isActive}`);

  } catch (error) {
    console.error('[Delivery Toggle] Error updating delivery status:', error);
    // في حالة الفشل، أرجع مربع الاختيار إلى حالته السابقة
    checkbox.checked = !isActive;
    Swal.fire({
      title: 'خطأ',
      text: 'فشل تحديث حالة الموزع. الرجاء المحاولة مرة أخرى.',
      icon: 'error',
      target: document.getElementById('users-modal-container'), // عرض التنبيه داخل المودال
    });
  } finally {
    checkbox.disabled = false; // إعادة تفعيل مربع الاختيار
  }
}

/**
 * @description يقوم بجلب علاقات الموزعين وعرضها في جدول داخل بطاقة البائع.
 * @param {string} sellerKey - مفتاح البائع.
 * @param {HTMLElement} container - الحاوية التي سيتم عرض الجدول بداخلها.
 */
async function loadDeliveryRelations(sellerKey, container) {
  container.innerHTML = '<div class="loader loader-small"></div>';

  try {
    const response = await fetchWithAuth(`/api/suppliers-deliveries?sellerKey=${sellerKey}`);
    if (!response.ok) throw new Error('Failed to fetch delivery relations');

    const relations = await response.json();

    if (relations.length === 0) {
      container.innerHTML = '<p>لا يوجد موزعين لعرضهم.</p>';
      return;
    }

    let tableHTML = `
      <table class="deliveries-table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الهاتف</th>
            <th>نشط</th>
          </tr>
        </thead>
        <tbody>
          ${relations.map(rel => `
            <tr>
              <td>${rel.username}</td>
              <td class="delivery-phone">${rel.phone}</td>
              <td><input type="checkbox" class="status-toggle-checkbox" data-seller-key="${sellerKey}" data-delivery-key="${rel.deliveryKey}" ${rel.isActive ? 'checked' : ''}></td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
    container.innerHTML = tableHTML;
  } catch (error) {
    console.error(`[Load Deliveries] Error loading relations for seller ${sellerKey}:`, error);
    container.innerHTML = '<p>حدث خطأ أثناء تحميل بيانات الموزعين.</p>';
  }
}