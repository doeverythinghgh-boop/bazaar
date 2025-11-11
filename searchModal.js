/**
 * @file searchModal.js
 * @description وحدة للتحكم في نافذة البحث المنبثقة.
 */

/**
 * يقوم بتهيئة نافذة البحث المنبثقة.
 * يحمل محتوى النافذة من ملف HTML ويربط الأحداث.
 * @param {string} containerId - معرف الحاوية التي سيتم تحميل النافذة بداخلها.
 * @param {string} openTriggerId - معرف الزر الذي يفتح النافذة.
 */
async function initSearchModal(containerId, openTriggerId) {
  const modalContainer = document.getElementById(containerId);
  const openSearchBtn = document.getElementById(openTriggerId);

  if (!modalContainer || !openSearchBtn) {
    console.error('[SearchModal] لم يتم العثور على حاوية النافذة أو زر الفتح.');
    return;
  }

  try {
    // تحميل محتوى النافذة من الملف الخارجي
    const response = await fetch('searchModal.html');
    if (!response.ok) throw new Error('فشل تحميل محتوى نافذة البحث');
    modalContainer.innerHTML = await response.text();
    console.log('%c[SearchModal] تم تحميل محتوى نافذة البحث بنجاح.', 'color: #20c997');

    // بعد تحميل المحتوى، يمكننا الوصول للعناصر
    const searchModal = document.getElementById('search-modal');
    const closeSearchBtn = document.getElementById('search-modal-close-btn');
    const searchModalInput = document.getElementById('search-modal-input');

    const openModal = () => {
      searchModal.style.display = 'block';
      document.body.classList.add('modal-open');
      setTimeout(() => searchModalInput.focus(), 50); // التركيز على حقل البحث
    };

    const closeModal = () => {
      searchModal.style.display = 'none';
      document.body.classList.remove('modal-open');
    };

    openSearchBtn.addEventListener('click', openModal);
    closeSearchBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
      if (event.target === searchModal) {
        closeModal();
      }
    });
  } catch (error) {
    console.error('%c[SearchModal] خطأ في تهيئة نافذة البحث:', 'color: red;', error);
  }
}