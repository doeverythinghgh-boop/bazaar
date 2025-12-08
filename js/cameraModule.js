/**
 * @file js/cameraUtils.js
 * @description موديول مشترك للتعامل مع الكاميرا، ضغط الصور، وحفظها مؤقتًا في IndexedDB (بدلاً من LocalStorage).
 * التغييرات الرئيسية:
 *  - الانتقال من LocalStorage إلى IndexedDB لتخزين الـ Blobs (أداء ومرونة أعلى).
 *  - ضغط الصور داخل Web Worker باستخدام createImageBitmap + OffscreenCanvas (لتخفيف الـ UI thread).
 *  - تخزين Blob مباشرة بدلاً من Base64 لتقليل الذاكرة ومساحة التخزين.
 *  - تحسين إدارة الموارد: إغلاق ImageBitmap، تحرير المراجع، وإلغاء Object URLs إن وُجدت.
 *  - تحسين التعامل مع عنصر <input>: عدم إزالته فورًا، وإضافة fallback للكاميرا الأمامية (user).
 *
 * متوافق مع متصفحات حديثة على الأجهزة المحمولة (Android/iOS) تدعم:
 *  - IndexedDB
 *  - createImageBitmap (في Worker أو main thread)
 *  - OffscreenCanvas (إن وُجد؛ إذا لم يتوفر، يستخدم canvas في الـ Worker إن أمكن)
 *
 * استخدام:
 *  - CameraUtils.openCamera('productAdd')
 *  - CameraUtils.checkForSavedImages('productAdd', (filesArray) => { ... })
 *  - CameraUtils.clearSavedImages('productAdd') // لحذف الصور المؤقتة
 */

window.CameraUtils = (function () {
  // ---------- إعدادات وضوابط ----------
  const IMAGE_MAX_WIDTH = 1600;
  const IMAGE_MAX_HEIGHT = 1600;
  const IMAGE_QUALITY = 0.75; // 0..1
  const DB_NAME = 'camera_utils_db_v1';
  const DB_STORE = 'camera_images';
  const DB_VERSION = 1;

  // حالة لتفادي تشغيل متزامن
  let isProcessing = false;

  // ---------- Web Worker: ضغط الصور خارج الـ UI Thread ----------
  // ننشئ Worker ديناميكيًا من نص ليعمل في نفس الملف ولا يحتاج ملف خارجي.
  const workerScript = `
    self.onmessage = async function (ev) {
      const { id, arrayBuffer, type, maxWidth, maxHeight, quality } = ev.data;
      let result = { id, success: false, error: null, blobBuffer: null, blobType: 'image/jpeg' };
      let imgBitmap = null;
      try {
        const uint8 = arrayBuffer instanceof ArrayBuffer ? arrayBuffer : arrayBuffer.buffer;
        const blob = new Blob([uint8], { type });
        // محاولة استخدام createImageBitmap داخل الـ Worker
        if (self.createImageBitmap) {
          imgBitmap = await createImageBitmap(blob);
        } else {
          throw new Error('createImageBitmap not supported in worker');
        }

        const width = imgBitmap.width;
        const height = imgBitmap.height;
        const ratio = Math.min(1, maxWidth / width, maxHeight / height);
        const newWidth = Math.max(1, Math.round(width * ratio));
        const newHeight = Math.max(1, Math.round(height * ratio));

        // استخدام OffscreenCanvas إذا توفر
        let offscreen;
        if (typeof OffscreenCanvas !== 'undefined') {
          offscreen = new OffscreenCanvas(newWidth, newHeight);
          const ctx = offscreen.getContext('2d');
          // خلفية بيضاء للتعامل مع الشفافية عند التحويل إلى JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, newWidth, newHeight);
          ctx.drawImage(imgBitmap, 0, 0, newWidth, newHeight);
          // convertToBlob متاحة على OffscreenCanvas
          const outBlob = await offscreen.convertToBlob({ type: 'image/jpeg', quality });
          const outBuffer = await outBlob.arrayBuffer();
          result.blobBuffer = outBuffer;
          result.blobType = outBlob.type || 'image/jpeg';
        } else {
          // إذا لم يكن OffscreenCanvas متاحًا، نرسم على Canvas عبر DOM عبر fallback بسيط
          // ملاحظة: Worker بدون DOM لا يمكنه إنشاء عنصر canvas العادي، لذا نرمي خطأ واضح.
          throw new Error('OffscreenCanvas not supported in worker');
        }

        // تنظيف
        try { if (imgBitmap && typeof imgBitmap.close === 'function') imgBitmap.close(); } catch(e) {}
        imgBitmap = null;

        result.success = true;
      } catch (err) {
        result.error = (err && err.message) ? err.message : String(err);
        try { if (imgBitmap && typeof imgBitmap.close === 'function') imgBitmap.close(); } catch(e) {}
        imgBitmap = null;
      }
      // نرسل النتيجة؛ ننقل ArrayBuffer باستخدام transferable لتحسين الأداء
      if (result.blobBuffer) {
        self.postMessage(result, [result.blobBuffer]);
      } else {
        self.postMessage(result);
      }
    };
  `;

  const workerBlob = new Blob([workerScript], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(workerBlob);

  // ننشئ Worker واحد يعاد استخدامه طوال جلسة الصفحة
  const compressWorker = new Worker(workerUrl);

  // ---------- IndexedDB Helpers ----------
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          const store = db.createObjectStore(DB_STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('pageId', 'pageId', { unique: false });
        }
      };
      req.onsuccess = function (e) {
        resolve(e.target.result);
      };
      req.onerror = function (e) {
        reject(e.target.error || new Error('IndexedDB open error'));
      };
    });
  }

  async function addImageToDB(pageId, blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      const entry = {
        pageId,
        blob,
        createdAt: Date.now()
      };
      const req = store.add(entry);
      req.onsuccess = function () {
        resolve(req.result);
      };
      req.onerror = function (e) {
        reject(e.target.error || new Error('IndexedDB add error'));
      };
    });
  }

  async function getImagesFromDB(pageId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const store = tx.objectStore(DB_STORE);
      const index = store.index('pageId');
      const req = index.getAll(IDBKeyRange.only(pageId));
      req.onsuccess = function () {
        // نعيد مصفوفة من Blobs مع الـ id
        const results = (req.result || []).map(r => ({ id: r.id, blob: r.blob, createdAt: r.createdAt }));
        resolve(results);
      };
      req.onerror = function (e) {
        reject(e.target.error || new Error('IndexedDB getAll error'));
      };
    });
  }

  async function clearImagesFromDB(pageId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      const index = store.index('pageId');
      const req = index.openCursor(IDBKeyRange.only(pageId));
      req.onsuccess = function (e) {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve(true);
        }
      };
      req.onerror = function (e) {
        reject(e.target.error || new Error('IndexedDB clear error'));
      };
    });
  }

  // ---------- Helpers: تحويل File -> ArrayBuffer واستخدام الـ Worker ----------
  function fileToArrayBuffer(file) {
    return file.arrayBuffer(); // متاح في الملفات الحديثة
  }

  function compressWithWorker(arrayBuffer, type) {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).slice(2, 9);
      const onMessage = function (ev) {
        const data = ev.data;
        if (!data || data.id !== id) return;
        compressWorker.removeEventListener('message', onMessage);
        if (data.success) {
          // re-create a Blob from the returned buffer
          try {
            const outBlob = new Blob([data.blobBuffer], { type: data.blobType || 'image/jpeg' });
            resolve(outBlob);
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(data.error || 'Compression failed in worker'));
        }
      };
      // مؤقت: listener واحد يعالج أي id لكن البايت موزع مع id في الرسالة
      compressWorker.addEventListener('message', onMessage);

      // نرسل العمل إلى الـ Worker. نرسل buffer مع transferable إذا أمكن
      try {
        compressWorker.postMessage({
          id,
          arrayBuffer,
          type,
          maxWidth: IMAGE_MAX_WIDTH,
          maxHeight: IMAGE_MAX_HEIGHT,
          quality: IMAGE_QUALITY
        }, [arrayBuffer]);
      } catch (e) {
        // لو فشل الاتقال، نرسل بدون transferable (أبطأ)
        try {
          compressWorker.postMessage({
            id,
            arrayBuffer,
            type,
            maxWidth: IMAGE_MAX_WIDTH,
            maxHeight: IMAGE_MAX_HEIGHT,
            quality: IMAGE_QUALITY
          });
        } catch (err) {
          compressWorker.removeEventListener('message', onMessage);
          reject(err);
        }
      }
    });
  }

  // ---------- الدالة الأساسية: فتح الكاميرا والتقاط الصورة ----------
  async function openCamera(pageId) {
    if (isProcessing) {
      console.warn('[CameraUtils] Another operation in progress.');
      return;
    }
    isProcessing = true;

    // نحاول environment ثم user كـ fallback
    let triedEnv = false;
    let triedUser = false;
    let keepLoop = true;

    // helper لإنشاء input (لا نضيفه إلى DOM مرئي)
    const createInput = (captureMode) => {
      // إزالة عنصر سابق إن وجد (آمن)
      const prev = document.getElementById('temp-camera-input');
      if (prev) prev.remove();

      const input = document.createElement('input');
      input.id = 'temp-camera-input';
      input.type = 'file';
      input.accept = 'image/*';
      if (captureMode) {
        try {
          input.setAttribute('capture', captureMode);
        } catch (e) {
          // تجاهل إذا لم يقبل المتصفح السمة
        }
      }
      input.style.display = 'none';
      document.body.appendChild(input);
      return input;
    };

    try {
      while (keepLoop) {
        let captureMode = null;
        if (!triedEnv) {
          captureMode = 'environment';
          triedEnv = true;
        } else if (!triedUser) {
          captureMode = 'user';
          triedUser = true;
        } else {
          break;
        }

        const input = createInput(captureMode);

        // ننشئ Promise للـ change event
        const chosenPromise = new Promise((resolve) => {
          const onChange = function (e) {
            input.removeEventListener('change', onChange);
            resolve({ e, input });
          };
          input.addEventListener('change', onChange, { once: true });
        });

        // نضغط على input لفتح الكاميرا/المعرض
        try {
          input.click();
        } catch (err) {
          console.warn('[CameraUtils] input.click failed:', err);
        }

        const { e, input: usedInput } = await chosenPromise;

        if (!e.target.files || e.target.files.length === 0) {
          // المستخدم ألغى — نجرب fallback إذا لم نعطه سابقًا
          if (captureMode === 'environment' && !triedUser) {
            // نزيل هذا الـ input ثم نكرر الحلقة مع user
            if (usedInput && usedInput.parentNode) usedInput.remove();
            continue;
          } else {
            // إلغاء نهائي
            if (usedInput && usedInput.parentNode) usedInput.remove();
            break;
          }
        }

        const file = e.target.files[0];
        // نعرض loading
        try {
          Swal.fire({
            title: 'جاري معالجة الصورة...',
            text: 'يرجى الانتظار بينما يتم ضغط وحفظ الصورة.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
          });
        } catch (swalErr) { /* ignore if Swal not available */ }

        try {
          // 1) نحصل على ArrayBuffer من الملف (هذا لا يخلق سلسلة Base64 كبيرة)
          const arrayBuffer = await fileToArrayBuffer(file);

          // 2) نضغط الصورة داخل الـ Worker — سيرجع Blob مضغوط
          const compressedBlob = await compressWithWorker(arrayBuffer, file.type || 'image/jpeg');

          // 3) نحفظ الـ Blob مباشرة في IndexedDB
          await addImageToDB(pageId, compressedBlob);

          // 4) عند الحاجة لإعادة تحميل الصفحة لصفحة معينة، ندعو mainLoader كما قبلاً
          if (pageId === 'productAdd') {
            if (typeof mainLoader === 'function') {
              try {
                await mainLoader(
                  "./pages/productAdd.html",
                  "index-product-container",
                  300,
                  undefined,
                  ["showHomeIcon", "checkSavedImagesCallback"],
                  false
                );
              } catch (loaderErr) {
                console.error('[CameraUtils] mainLoader error:', loaderErr);
              }
            } else {
              console.error('[CameraUtils] mainLoader is not defined!');
            }
          }

          // إغلاق التنبيه
          try { Swal.close(); } catch (e) {}

          // تنظيف: إزالة الـ input الآن بعد إتمام المعالجة
          if (usedInput && usedInput.parentNode) usedInput.remove();

          // نجحنا في التقاط صورة واحدة — لا نعيد فتح الكاميرا تلقائيًا
          keepLoop = false;
          break;
        } catch (processErr) {
          console.error('[CameraUtils] processing error:', processErr);
          try {
            Swal.fire('خطأ', 'حدث خطأ أثناء معالجة الصورة. ' + (processErr.message || ''), 'error');
          } catch (e) {}

          // تنظيف input بعد الخطأ
          if (usedInput && usedInput.parentNode) usedInput.remove();

          // لو كانت المحاولة الأولى environment فنجرب user كـ fallback
          if (captureMode === 'environment' && !triedUser) {
            continue;
          } else {
            // لا مزيد من المحاولات
            keepLoop = false;
            break;
          }
        }
      } // نهاية الحلقة
    } finally {
      isProcessing = false;
    }
  }

  // ---------- استعادة الصور من IndexedDB للصفحة عند التحميل ----------
  // onImagesRestored يستقبل مصفوفة من File/Blob objects
  async function checkForSavedImages(pageId, onImagesRestored) {
    try {
      const items = await getImagesFromDB(pageId); // [{id, blob, createdAt}, ...]
      if (items && items.length > 0) {
        // نحول كل Blob إلى File (مع اسم قابل للعرض)
        const files = items.map((it, idx) => {
          const fileName = `restored_image_${it.id || idx}.jpg`;
          try {
            return new File([it.blob], fileName, { type: it.blob.type || 'image/jpeg' });
          } catch (e) {
            // بعض البيئات لا تدعم File constructor جيدًا، نعيد Blob كبديل
            return it.blob;
          }
        });

        // نمررها للنداء المرجعي
        if (typeof onImagesRestored === 'function') {
          try {
            onImagesRestored(files);
          } catch (cbErr) {
            console.error('[CameraUtils] onImagesRestored callback error:', cbErr);
          }
        }

        // بعد الاستعادة، نحذف العناصر من DB لتفريغ المساحة
        try {
          await clearImagesFromDB(pageId);
        } catch (clearErr) {
          console.error('[CameraUtils] clearing saved images error:', clearErr);
        }
      }
    } catch (err) {
      console.error('[CameraUtils] checkForSavedImages error:', err);
    }
  }

  // واجهة مساعدة لمسح الصور المؤقتة إن احتجت
  async function clearSavedImages(pageId) {
    return clearImagesFromDB(pageId);
  }

  // ---------- إرجاع الـ API ----------
  return {
    openCamera,
    checkForSavedImages,
    clearSavedImages
  };
})();
