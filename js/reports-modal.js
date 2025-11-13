/**
 * @file js/reports-modal.js
 * @description يحتوي على المنطق الخاص بعرض التقارير مثل حركة المشتريات.
 */

/**
 * ينشئ شريط تقدم زمني (Timeline) لحالة الطلب.
 * @param {object} statusDetails - كائن تفاصيل الحالة (id, state, description).
 * @returns {string} - كود HTML لشريط التقدم.
 */
function createStatusTimelineHTML(statusDetails) {
  const currentStatusId = statusDetails.id;

  const progressStates = [
    ORDER_STATUS_MAP.REVIEW,
    ORDER_STATUS_MAP.CONFIRMED,
    ORDER_STATUS_MAP.SHIPPED,
    ORDER_STATUS_MAP.DELIVERED
  ];

  if (!progressStates.some(p => p.id === currentStatusId)) {
    const statusClass = `status-${currentStatusId}`;
    let icon = 'fa-info-circle';
    if (currentStatusId === ORDER_STATUS_MAP.CANCELLED.id || currentStatusId === ORDER_STATUS_MAP.REJECTED.id) {
      icon = 'fa-times-circle';
    } else if (currentStatusId === ORDER_STATUS_MAP.RETURNED.id) {
      icon = 'fa-undo-alt';
    }

    return `
      <div class="status-timeline-exception-wrapper">
        <div class="status-timeline-exception ${statusClass}">
          <i class="fas ${icon}"></i>
          <span>${statusDetails.state}</span>
        </div>
        <p class="timeline-description">${statusDetails.description}</p>
      </div>
    `;
  }

  let timelineHTML = '<div class="status-timeline">';
  progressStates.forEach((state, index) => {
    const isActive = currentStatusId >= state.id;
    const isCurrent = currentStatusId === state.id;
    const stepClass = isActive ? 'active' : '';
    const currentClass = isCurrent ? 'current' : '';

    timelineHTML += `
      <div class="timeline-step ${stepClass} ${currentClass}" title="${state.description}">
        <div class="timeline-dot"></div>
        <div class="timeline-label">${state.state}</div>
      </div>
    `;
    if (index < progressStates.length - 1) {
      timelineHTML += `<div class="timeline-line ${stepClass}"></div>`;
    }
  });
  timelineHTML += '</div>';

  const descriptionHTML = `<p class="timeline-description">${statusDetails.description}</p>`;

  return timelineHTML + descriptionHTML;
}

/**
 * يعرض نافذة منبثقة بحركة المشتريات لجميع الطلبات.
 */
async function showSalesMovementModal() {
  const modalContainer = document.getElementById("sales-movement-modal-container");

  modalContainer.innerHTML = `
    <div class="modal-content large">
      <span class="close-button" id="sales-movement-modal-close-btn">&times;</span>
      <h2><i class="fas fa-dolly-flatbed"></i> حركة المشتريات</h2>
      <div class="loader" style="margin: 2rem auto;"></div>
    </div>`;
  
  document.body.classList.add("modal-open");
  modalContainer.style.display = "block";

  const closeModal = () => {
    modalContainer.style.display = "none";
    document.body.classList.remove("modal-open");
  };

  document.getElementById("sales-movement-modal-close-btn").onclick = closeModal;
  window.addEventListener('click', (event) => {
    if (event.target == modalContainer) closeModal();
  }, { once: true });

  const orders = await getSalesMovement();
  const modalContentEl = modalContainer.querySelector('.modal-content');

  let contentHTML = `
    <span class="close-button" id="sales-movement-modal-close-btn">&times;</span>
    <h2><i class="fas fa-dolly-flatbed"></i> حركة المشتريات</h2>`;

  if (orders && orders.length > 0) {
    contentHTML += '<div id="sales-movement-list">';
    orders.forEach(order => {
      const isoDateTime = order.created_at.replace(' ', 'T') + 'Z';
      const orderDate = new Date(isoDateTime).toLocaleString('ar-EG', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo'
      });

      let itemsTable = `<table class="order-items-table"><thead><tr><th>المنتج</th><th>الكمية</th><th>سعر القطعة</th><th>الإجمالي</th></tr></thead><tbody>`;
      order.items.forEach(item => {
        const itemTotal = (item.product_price * item.quantity).toFixed(2);
        itemsTable += `<tr><td>${item.productName}</td><td>${item.quantity}</td><td>${item.product_price.toFixed(2)} ج.م</td><td>${itemTotal} ج.م</td></tr>`;
      });
      itemsTable += '</tbody></table>';

      contentHTML += `
        <div class="purchase-item">
          <div class="purchase-item-details">
            <p><strong>رقم الطلب:</strong> ${order.order_key}</p>
            <p><strong>العميل:</strong> ${order.customer_name} (${order.customer_phone})</p>
            <p><strong>العنوان:</strong> ${order.customer_address || 'غير محدد'}</p>
            <p><strong>تاريخ الطلب:</strong> ${orderDate}</p>
            <p><strong>إجمالي الطلب:</strong> ${order.total_amount.toFixed(2)} جنيه</p>
            <div class="purchase-status-container">
              ${createStatusTimelineHTML(ORDER_STATUSES.find(s => s.id === order.order_status) || ORDER_STATUSES[0])}
            </div>
            <h4>المنتجات:</h4>
            ${itemsTable}
          </div>
        </div>`;
    });
    contentHTML += '</div>';
  } else {
    contentHTML += '<p style="text-align: center; padding: 2rem 0;">لا توجد طلبات لعرضها.</p>';
  }

  modalContentEl.innerHTML = contentHTML;
  modalContentEl.querySelector('#sales-movement-modal-close-btn').onclick = closeModal;
}