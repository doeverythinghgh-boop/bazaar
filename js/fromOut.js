
let fileInput0 ;
let pickFilesBtn ;
let takePhotoBtn ;
let previewsEl ;
let uploaderEl ;
let IMAGE_MAX_WIDTH = 1600; // أقصى عرض بعد الضغط
let IMAGE_MAX_HEIGHT = 1600; // أقصى ارتفاع بعد الضغط
let IMAGE_QUALITY = 0.75; // جودة ضغط 0..1
let MAX_FILES = 6; // حد معقول من الصور
const images = [];
function getElements(){
    fileInput0 = document.getElementById('fileInput00');
pickFilesBtn = document.getElementById('pick-files-btn');
 takePhotoBtn = document.getElementById('take-photo-btn');
 previewsEl = document.getElementById('previews');
 uploaderEl = document.getElementById('image-uploader');
}

// --- معالجة ملفات عند اختيارها أو إفلاتها ---
async function handleNewFiles(fileList) {

    // إخفاء رسالة الخطأ الخاصة بالصور بمجرد محاولة إضافة صور جديدة
    console.log(`[ImageUploader] Handling ${fileList.length} new files.`);
    //clearError(uploaderEl);

    const filesArr = Array.from(fileList).slice(0, MAX_FILES - images.length);
    for (const file of filesArr) {
        if (!file.type.startsWith('image/')) continue;
        const id = genId();
        const state = { id, file, compressedBlob: null, status: 'pending' };
        images.push(state); // إضافة الصورة الجديدة إلى مصفوفة الحالة
        createPreviewItem(state);
        // ضغط الصورة (غير متزامن، تحدث التحديثات على واجهة المعاينة)
        try {
            console.log(`[ImageUploader] Compressing image: ${file.name}`);
            state.status = 'compressing';
            const compressed = await compressImage(file);
            state.compressedBlob = compressed;
            state.status = 'ready';
            console.log(`%c[ImageUploader] Image compressed successfully: ${file.name} -> ${formatBytes(compressed.size)}`, 'color: green;');
            // تحديث واجهة المستخدم بحجم الصورة بعد الضغط
            if (state._metaEl) {
                state._metaEl.textContent = formatBytes(compressed.size);
            }
        } catch (err) {
            console.error('%c[ImageUploader] Error compressing image:', 'color: red;', err);
            state.status = 'error';
            if (state._metaEl) {
                state._metaEl.textContent = 'خطأ';
            }
        }
    }
    // *** الإصلاح: إعادة تعيين قيمة حقل إدخال الملفات ***
    // هذا يضمن أن حدث 'change' سيعمل حتى لو تم اختيار نفس الملف مرة أخرى
    fileInput0.value = '';

}