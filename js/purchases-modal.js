/**
 * @file js/ui/purchases-modal.js
 * @description يحتوي على المنطق الخاص بعرض سجل مشتريات المستخدم.
}

/**
 * يعرض نافذة منبثقة بسجل مشتريات المستخدم.
 * @param {string} userKey - المفتاح الفريد للمستخدم.
 */
async function showPurchasesModal(userKey) {
  const purchasesModal = document.getElementById("purchases-modal-container");
  
  // عرض النافذة مع مؤشر تحميل
  purchasesModal.innerHTML = `
    <div class="modal-content">
      <span class="close-button" id="purchases-modal-close-btn">&times;</span>
      <h2><i class="fas fa-history"></i> سجل المشتريات</h2>
      <div class="loader" style="margin: 2rem auto;"></div>
    </div>`;
  
  // ✅ تعديل: استخدام الدالة المساعدة لإدارة النافذة
  const modalLogic = setupModalLogic(
    "purchases-modal-container",
    "purchases-modal-close-btn"
  );
  if (!modalLogic) return;
  modalLogic.open();

  // جلب البيانات
  const purchases = await getUserPurchases(userKey);
  // استخدام العنصر من الدالة المساعدة لضمان أنه موجود
  const modalContentEl = modalLogic.modalElement.querySelector('.modal-content');
  if (!modalContentEl) return;

  // بناء المحتوى بعد جلب البيانات
  let contentHTML = `
    <span class="close-button" id="purchases-modal-close-btn">&times;</span>
    <h2><i class="fas fa-history"></i> سجل المشتريات</h2>`;

  if (purchases && purchases.length > 0) {
    contentHTML += '<div id="purchases-list">';
    purchases.forEach(item => {
      const firstImage = item.ImageName ? item.ImageName.split(',')[0] : '';
      const imageUrl = firstImage 
        ? `https://pub-e828389e2f1e484c89d8fb652c540c12.r2.dev/${firstImage}`
        : 'data:image/svg+xml,...'; // صورة افتراضية
      
      // ✅ إصلاح نهائي: تحويل التاريخ إلى صيغة ISO 8601 القياسية (YYYY-MM-DDTHH:MM:SSZ)
      // هذا يضمن أن جميع المتصفحات ستفسره كتوقيت UTC بشكل صحيح قبل تحويله للمنطقة المحلية.
      const isoDateTime = item.created_at.replace(' ', 'T') + 'Z';
      const purchaseDate = new Date(isoDateTime).toLocaleString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
        timeZone: 'Africa/Cairo' // ✅ جديد: تحديد المنطقة الزمنية بشكل صريح
      });


      // ✅ إضافة: حساب الإجمالي لكل منتج
      const itemPrice = parseFloat(item.product_price) || 0;
      const itemQuantity = parseInt(item.quantity, 10) || 0;
      const itemTotal = (itemPrice * itemQuantity).toFixed(2);

      contentHTML += `
        <div class="purchase-item">
          <img src="${imageUrl}" alt="${item.productName}">
          <div class="purchase-item-details">
            <strong>${item.productName}</strong>
            <p><strong>سعر القطعة:</strong> ${itemPrice.toFixed(2)} جنيه</p>
            <p><strong>الكمية:</strong> ${item.quantity}</p>
            <p><strong>الإجمالي:</strong> ${itemTotal} جنيه</p>
            <p><strong>تاريخ الطلب:</strong> ${purchaseDate}</p>
            <div class="purchase-status-container">
              ${createStatusTimelineHTML(item.status_details)}
            </div>
          </div>
        </div>`;
    });
    contentHTML += '</div>';
  } else if (purchases) {
    contentHTML += '<p style="text-align: center; padding: 2rem 0;">لا توجد مشتريات سابقة.</p>';
  } else {
    contentHTML += '<p style="text-align: center; padding: 2rem 0; color: red;">حدث خطأ أثناء تحميل سجل المشتريات.</p>';
  }

  modalContentEl.innerHTML = contentHTML;
  // إعادة ربط حدث الإغلاق بعد تحديث المحتوى
  const newCloseBtn = modalContentEl.querySelector('#purchases-modal-close-btn');
  if (newCloseBtn) {
    newCloseBtn.onclick = modalLogic.close;
  }
}