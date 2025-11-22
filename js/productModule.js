/**
 * الوحدة الرئيسية لإدارة صور المنتج والنموذج
 */
window.productModule = (function() {
  // إعدادات ضغط الصور
  const IMAGE_MAX_WIDTH = 1600;
  const IMAGE_MAX_HEIGHT = 1600;
  const IMAGE_QUALITY = 0.75;
  const MAX_FILES = 6;

  let fileInput, pickFilesBtn, takePhotoBtn, clearAllBtn, previewsEl, uploaderEl;
  const images = [];
  let idCounter = 1;
  let WEBP_SUPPORTED_PROMISE;
  let eventListeners = [];

  // توليد معرف فريد
  function productGenId() { 
    return 'img_' + (Date.now() + idCounter++); 
  }

  // إزالة جميع مستمعي الأحداث
  function productRemoveEventListeners() {
    eventListeners.forEach(({ element, event, handler }) => {
      if (element && handler) {
        element.removeEventListener(event, handler);
      }
    });
    eventListeners = [];
  }

  // إضافة مستمع حدث مع التتبع
  function productAddEventListener(element, event, handler) {
    if (element && handler) {
      element.addEventListener(event, handler);
      eventListeners.push({ element, event, handler });
    }
  }

  // ضغط الصورة
  async function productCompressImage(file) {
    const imgBitmap = await createImageBitmap(file);
    let { width, height } = imgBitmap;

    const ratio = Math.min(1, IMAGE_MAX_WIDTH / width, IMAGE_MAX_HEIGHT / height);
    const newWidth = Math.round(width * ratio);
    const newHeight = Math.round(height * ratio);

    const canvas = Object.assign(document.createElement('canvas'), { 
      width: newWidth, 
      height: newHeight 
    });
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,newWidth,newHeight);
    ctx.drawImage(imgBitmap, 0, 0, newWidth, newHeight);

    const webpSupported = await WEBP_SUPPORTED_PROMISE;
    const mime = webpSupported ? 'image/webp' : 'image/jpeg';

    const blob = await new Promise((res) => canvas.toBlob(res, mime, IMAGE_QUALITY));

    try { imgBitmap.close(); } catch(e){}

    return blob;
  }

  // إنشاء معاينة الصورة
  function productCreatePreviewItem(state, existingImageUrl = null) {
    if (!previewsEl) {
      console.error('previewsEl not initialized');
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'add-product-modal__preview';
    wrapper.setAttribute('data-id', state.id);

    productAddEventListener(wrapper, 'click', (e) => {
      if (e.target.closest('.add-product-modal__preview-remove')) return;
      document.querySelectorAll('.add-product-modal__preview--selected').forEach(p => {
        p.classList.remove('add-product-modal__preview--selected');
      });
      wrapper.classList.add('add-product-modal__preview--selected');
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = "button";
    removeBtn.className = 'add-product-modal__preview-remove';
    removeBtn.setAttribute('title', 'إزالة الصورة');
    removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    productAddEventListener(removeBtn, 'click', () => productRemoveImage(state.id));

    const img = document.createElement('img');
    const meta = document.createElement('div');
    meta.className = 'add-product-modal__preview-meta';
    meta.textContent = 'جاري الحساب...';

    wrapper.appendChild(removeBtn);
    wrapper.appendChild(img);
    wrapper.appendChild(meta);

    if (existingImageUrl) {
      img.src = existingImageUrl;
      meta.textContent = 'صورة حالية';
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.readAsDataURL(state.file);
    }

    previewsEl.appendChild(wrapper);
    state._el = wrapper;
    state._metaEl = meta;
  }

  // حذف صورة
  function productRemoveImage(id) {
    console.log(`[ImageUploader] Attempting to remove image with id: ${id}`);
    if (typeof Swal === 'undefined') {
      if (confirm('هل تريد بالتأكيد حذف هذه الصورة؟')) {
        removeImageById(id);
      }
      return;
    }

    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: "هل تريد بالتأكيد حذف هذه الصورة؟",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذفها!',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        removeImageById(id);
      }
    });
  }

  function removeImageById(id) {
    const idx = images.findIndex(i => i.id === id);
    if (idx > -1) {
      const state = images[idx];
      if (state._el) state._el.remove();
      console.log(`[ImageUploader] Image ${id} removed from view.`);
      images.splice(idx, 1);
    }
  }

  // مسح جميع الصور
  function productClearAll() {
    console.log('[ImageUploader] Attempting to clear all images.');
    if (images.length === 0) return;

    if (typeof Swal === 'undefined') {
      if (confirm('سيتم حذف جميع الصور المضافة!')) {
        clearAllImages();
      }
      return;
    }

    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: "سيتم حذف جميع الصور المضافة!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#3498db',
      confirmButtonText: 'نعم، احذف الكل!',
      cancelButtonText: 'إلغاء'
    }).then((result) => {
      if (result.isConfirmed) {
        clearAllImages();
      }
    });
  }

  function clearAllImages() {
    if (previewsEl) {
      previewsEl.innerHTML = '';
    }
    console.log('[ImageUploader] All images cleared.');
    images.length = 0;
  }

  // معالجة الملفات الجديدة
  async function productHandleNewFiles(fileList){
    console.log(`[ImageUploader] Handling ${fileList.length} new files.`);
    if (uploaderEl) {
      productClearError(uploaderEl);
    }

    const filesArr = Array.from(fileList).slice(0, MAX_FILES - images.length);
    for(const file of filesArr){
      if(!file.type.startsWith('image/')) continue;
      const id = productGenId();
      const state = { id, file, compressedBlob: null, status:'pending' };
      images.push(state);
      productCreatePreviewItem(state);
      
      try{
        console.log(`[ImageUploader] Compressing image: ${file.name}`);
        state.status = 'compressing';
        const compressed = await productCompressImage(file);
        state.compressedBlob = compressed;
        state.status = 'ready';
        console.log(`%c[ImageUploader] Image compressed successfully: ${file.name} -> ${productFormatBytes(compressed.size)}`, 'color: green;');
        if (state._metaEl) {
          state._metaEl.textContent = productFormatBytes(compressed.size);
        }
      }catch(err){
        console.error('%c[ImageUploader] Error compressing image:', 'color: red;', err);
        state.status = 'error';
        if (state._metaEl) {
          state._metaEl.textContent = 'خطأ';
        }
      }
    }
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // فتح كاميرا سطح المكتب
  async function productOpenDesktopCamera() {
    const cameraModalContainer = document.getElementById('camera-modal-container');
    if (!cameraModalContainer) {
      console.error('Camera modal container not found!');
      return;
    }

    cameraModalContainer.innerHTML = `
      <div class="modal-content camera-modal-content">
        <button class="close-button" id="camera-modal-close-btn" aria-label="إغلاق"><i class="fas fa-times"></i></button>
        <video id="camera-preview" autoplay playsinline></video>
        <canvas id="camera-canvas" style="display:none;"></canvas>
        <div class="camera-controls">
          <button id="capture-photo-btn" class="btn btn-primary"><i class="fas fa-camera"></i> التقاط الصورة</button>
        </div>
      </div>
    `;
    cameraModalContainer.style.display = 'flex';

    const video = document.getElementById('camera-preview');
    const captureBtn = document.getElementById('capture-photo-btn');
    const closeBtn = document.getElementById('camera-modal-close-btn');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      video.srcObject = stream;

      const closeStream = () => {
        stream.getTracks().forEach(track => track.stop());
        cameraModalContainer.style.display = 'none';
        cameraModalContainer.innerHTML = '';
      };

      productAddEventListener(closeBtn, 'click', closeStream);

      productAddEventListener(captureBtn, 'click', () => {
        const canvas = document.getElementById('camera-canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(blob => {
          productHandleNewFiles([blob]);
          closeStream();
        }, 'image/jpeg', 0.9);
      });
    } catch (err) {
      console.error("Error accessing camera: ", err);
      if (typeof Swal !== 'undefined') {
        Swal.fire('خطأ!', 'لم نتمكن من الوصول إلى الكاميرا. يرجى التأكد من منح الإذن اللازم.', 'error');
      } else {
        alert('خطأ في الوصول إلى الكاميرا!');
      }
      cameraModalContainer.style.display = 'none';
    }
  }

  // إعداد مستمعي الأحداث
  function productSetupEventListeners() {
    if (!pickFilesBtn || !clearAllBtn || !takePhotoBtn || !fileInput || !uploaderEl) {
      console.error('One or more DOM elements not found for event listeners');
      return false;
    }

    // إزالة المستمعين السابقين أولاً
    productRemoveEventListeners();

    // إضافة مستمعي الأحداث الجدد
    productAddEventListener(pickFilesBtn, 'click', () => {
      fileInput.removeAttribute('capture');
      fileInput.click();
    });

    productAddEventListener(clearAllBtn, 'click', () => productClearAll());

    productAddEventListener(takePhotoBtn, 'click', () => {
      const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
      if (isMobile) {
        console.log('[Camera] Mobile device detected. Using capture attribute.');
        fileInput.setAttribute('capture', 'environment');
        fileInput.click();
      } else {
        console.log('[Camera] Desktop device detected. Using getUserMedia API.');
        productOpenDesktopCamera();
      }
    });

    productAddEventListener(fileInput, 'change', (e) => productHandleNewFiles(e.target.files));

    // سحب وإفلات
    productAddEventListener(uploaderEl, 'dragover', (e) => { 
      e.preventDefault(); 
      uploaderEl.style.borderColor = '#007bff'; 
    });
    
    productAddEventListener(uploaderEl, 'dragleave', (e) => { 
      uploaderEl.style.borderColor = ''; 
    });
    
    productAddEventListener(uploaderEl, 'drop', (e) => { 
      e.preventDefault(); 
      uploaderEl.style.borderColor = ''; 
      productHandleNewFiles(e.dataTransfer.files); 
    });

    return true;
  }

  // تهيئة الوحدة
  function productInitModule() {
    console.log('[ProductModule] Initializing module...');

    // الحصول على عناصر DOM
    fileInput = document.getElementById('file-input');
    pickFilesBtn = document.getElementById('pick-files-btn');
    takePhotoBtn = document.getElementById('take-photo-btn');
    clearAllBtn = document.getElementById('clear-all-btn');
    previewsEl = document.getElementById('previews');
    uploaderEl = document.getElementById('image-uploader');

    // التحقق من وجود جميع العناصر
    const elements = { fileInput, pickFilesBtn, takePhotoBtn, clearAllBtn, previewsEl, uploaderEl };
    let missingElements = [];
    
    Object.keys(elements).forEach(key => {
      if (!elements[key]) {
        missingElements.push(key);
      }
    });

    if (missingElements.length > 0) {
      console.error('Required DOM elements for product module not found:', missingElements);
      return false;
    }

    // تهيئة دعم WebP
    WEBP_SUPPORTED_PROMISE = productSupportsWebP();

    // إعداد مستمعي الأحداث
    if (!productSetupEventListeners()) {
      return false;
    }

    console.log('%c[ProductModule] Initialized successfully', 'color: green;');
    return true;
  }

  // إعادة تعيين الوحدة
  function productResetModule() {
    console.log('[ProductModule] Resetting module...');
    
    images.length = 0;
    idCounter = 1;
    
    if (previewsEl) {
      previewsEl.innerHTML = '';
    }
    
    // إزالة جميع مستمعي الأحداث
    productRemoveEventListeners();
    
    // إعادة تعيين مراجع DOM
    fileInput = null;
    pickFilesBtn = null;
    takePhotoBtn = null;
    clearAllBtn = null;
    previewsEl = null;
    uploaderEl = null;

    console.log('[ProductModule] Reset completed');
  }

  // تنظيف الوحدة (للاستدعاء عند إغلاق الموديول)
  function productCleanupModule() {
    console.log('[ProductModule] Cleaning up module...');
    productResetModule();
  }

 
return {
  init: productInitModule,
  reset: productResetModule,
  cleanup: productCleanupModule,
  images,
  originalImageNames: [],
  genId: productGenId,
  createPreviewItem: productCreatePreviewItem,
  
  // دوال جديدة لإدارة حالة الصور
  updateImageStatus: function(imageId, newStatus, newFileName = null) {
    const image = this.images.find(img => img.id === imageId);
    if (image) {
      image.status = newStatus;
      if (newFileName) {
        image.fileName = newFileName;
      }
      console.log(`[ProductModule] Updated image ${imageId} status to ${newStatus}`);
    }
  },
  
  getImageStatus: function(imageId) {
    const image = this.images.find(img => img.id === imageId);
    return image ? image.status : null;
  }
};
})();