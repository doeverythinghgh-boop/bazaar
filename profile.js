/**
 * @file js/ui/profile.js
 * @description يحتوي على المنطق الخاص بعرض وتحديث الملف الشخصي للمستخدم.
 */

/**
 * يعرض نافذة منبثقة لتعديل بيانات المستخدم.
 * @param {object} currentUser - بيانات المستخدم الحالية.
 */
async function showEditProfileModal(currentUser) {
  const { value: formValues } = await Swal.fire({
    title: 'تعديل بياناتك الشخصية',
    html: `
      <div style="text-align: right; display: flex; flex-direction: column; gap: 1rem;">
        <input id="swal-username" class="swal2-input" placeholder="الاسم" value="${currentUser.username || ''}">
        <input id="swal-phone" class="swal2-input" placeholder="رقم الهاتف" value="${currentUser.phone || ''}">
        <input id="swal-address" class="swal2-input" placeholder="العنوان (اختياري)" value="${currentUser.Address || ''}">
        <hr style="border-top: 1px solid #eee; margin: 0.5rem 0;">
        <p style="font-size: 0.9rem; color: #555;">لتغيير كلمة المرور، أدخل كلمة المرور الجديدة أدناه.</p>
        <div class="swal2-password-container">
          <input type="password" id="swal-password" class="swal2-input" placeholder="كلمة المرور الجديدة (اختياري)">
          <i class="fas fa-eye swal2-password-toggle-icon" id="swal-toggle-password"></i>
        </div>
        <div class="swal2-password-container">
          <input type="password" id="swal-confirm-password" class="swal2-input" placeholder="تأكيد كلمة المرور الجديدة">
          <i class="fas fa-eye swal2-password-toggle-icon" id="swal-toggle-confirm-password"></i>
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'حفظ التغييرات',
    cancelButtonText: 'إلغاء',
    showLoaderOnConfirm: true,
    didOpen: () => {
      // وظيفة تبديل عرض كلمة المرور
      const togglePasswordVisibility = (inputId, toggleId) => {
        const passwordInput = document.getElementById(inputId);
        const toggleIcon = document.getElementById(toggleId);
        toggleIcon.addEventListener('click', () => {
          const isPassword = passwordInput.type === 'password';
          passwordInput.type = isPassword ? 'text' : 'password';
          toggleIcon.classList.toggle('fa-eye');
          toggleIcon.classList.toggle('fa-eye-slash');
        });
      };
      togglePasswordVisibility('swal-password', 'swal-toggle-password');
      togglePasswordVisibility('swal-confirm-password', 'swal-toggle-confirm-password');
    },
    preConfirm: async () => { // تحويل الدالة إلى async
      const username = document.getElementById('swal-username').value;
      const phone = document.getElementById('swal-phone').value;
      const address = document.getElementById('swal-address').value;
      const password = document.getElementById('swal-password').value;
      const confirmPassword = document.getElementById('swal-confirm-password').value;

      // التحقق من صحة المدخلات
      if (!username.trim() || username.length < 8) {
        Swal.showValidationMessage('الاسم مطلوب ويجب أن يكون 8 أحرف على الأقل.');
        return false;
      }
      if (!phone.trim() || phone.length < 11) {
        Swal.showValidationMessage('رقم الهاتف مطلوب ويجب أن يكون 11 رقمًا على الأقل.');
        return false;
      }
      if (password && password !== confirmPassword) {
        Swal.showValidationMessage('كلمتا المرور غير متطابقتين.');
        return false;
      }

      // إذا تم إدخال كلمة مرور جديدة، تحقق من القديمة أولاً
      if (password) {
        const { value: oldPassword } = await Swal.fire({
          title: 'التحقق من الهوية',
          text: 'لتغيير كلمة المرور، الرجاء إدخال كلمة المرور القديمة.',
          input: 'password',
          inputPlaceholder: 'أدخل كلمة المرور القديمة',
          inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
          showCancelButton: true,
          confirmButtonText: 'تحقق',
          cancelButtonText: 'إلغاء',
          showLoaderOnConfirm: true,
          preConfirm: async (enteredOldPassword) => {
            if (!enteredOldPassword) {
              Swal.showValidationMessage('يجب إدخال كلمة المرور القديمة.');
              return false;
            }
            // استدعاء الواجهة البرمجية للتحقق من كلمة المرور القديمة
            const verificationResult = await verifyUserPassword(currentUser.phone, enteredOldPassword);
            if (verificationResult.error) {
              Swal.showValidationMessage(`كلمة المرور القديمة غير صحيحة.`);
              return false;
            }
            return true; // كلمة المرور صحيحة
          },
          allowOutsideClick: () => !Swal.isLoading()
        });

        // إذا لم يقم المستخدم بالتحقق أو ألغى العملية، أوقف التحديث
        if (!oldPassword) {
          Swal.showValidationMessage('تم إلغاء تغيير كلمة المرور.');
          return false;
        }
      }

      // تجميع البيانات التي تغيرت فقط
      const updatedData = { user_key: currentUser.user_key };
      if (username !== currentUser.username) updatedData.username = username;
      if (phone !== currentUser.phone) updatedData.phone = phone;
      if (address !== (currentUser.Address || '')) updatedData.address = address;
      if (password) updatedData.password = password;

      // إذا لم يتغير شيء، لا ترسل الطلب
      if (Object.keys(updatedData).length === 1) {
         Swal.fire('لم يتغير شيء', 'لم تقم بإجراء أي تغييرات على بياناتك.', 'info');
         return false; // يمنع إغلاق النافذة
      }

      return updatedData;
    }
  });

  if (formValues) {
    // إرسال البيانات إلى الخادم
    const result = await updateUser(formValues);

    if (result && !result.error) {
      // تحديث البيانات في localStorage
      const updatedUser = { ...currentUser };
      if (formValues.username) updatedUser.username = formValues.username;
      if (formValues.phone) updatedUser.phone = formValues.phone;
      if (formValues.address !== undefined) updatedUser.Address = formValues.address;
      // لا نحفظ كلمة المرور في localStorage

      localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));

      // تحديث الواجهة فورًا
      document.getElementById("welcome-message").textContent = `أهلاً بك، ${updatedUser.username}`;

      Swal.fire({
        icon: 'success',
        title: 'تم التحديث بنجاح!',
        text: result.message,
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'حدث خطأ',
        text: result.error || 'فشل تحديث البيانات. يرجى المحاولة مرة أخرى.',
      });
    }
  }
}