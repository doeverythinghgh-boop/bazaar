/**
 * @file js/ui/purchases-modal.js
 * @description يحتوي على المنطق الخاص بعرض سجل مشتريات المستخدم.
 */

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
  
  document.body.classList.add("modal-open");
  purchasesModal.style.display = "block";

  // وظيفة الإغلاق
  const closePurchasesModal = () => {
    purchasesModal.style.display = "none";
    document.body.classList.remove("modal-open");
  };

  document.getElementById("purchases-modal-close-btn").onclick = closePurchasesModal;
  window.addEventListener('click', (event) => {
    if (event.target == purchasesModal) closePurchasesModal();
  }, { once: true });

  // جلب البيانات
  const purchases = await getUserPurchases(userKey);
  const modalContentEl = purchasesModal.querySelector('.modal-content');

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

      // ✅ تعديل: استخدام بيانات الحالة الجاهزة من `status_details`
      const statusText = item.status_details.state;
      const statusClass = `status-${item.status_details.id}`; // بناء الكلاس ديناميكيًا (e.g., status-0, status-1)

      contentHTML += `
        <div class="purchase-item">
          <img src="${imageUrl}" alt="${item.productName}">
          <div class="purchase-item-details">
            <strong>${item.productName}</strong>
            <p><strong>السعر:</strong> ${item.product_price} جنيه</p>
            <p><strong>الكمية:</strong> ${item.quantity}</p>
            <p><strong>تاريخ الشراء:</strong> ${purchaseDate}</p>
            <p><strong>حالة الطلب:</strong> <span class="purchase-status ${statusClass}" title="${item.status_details.description}">${statusText}</span></p>
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
  modalContentEl.querySelector('#purchases-modal-close-btn').onclick = closePurchasesModal;
}