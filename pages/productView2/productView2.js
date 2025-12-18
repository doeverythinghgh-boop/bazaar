
    /**
     * @fileoverview Product View Details Logic with 3D Slider (productView_ module)
     * @description Handles product details display, 3D image slider, and custom photo order requests.
     */

    // ==============================================
    //  DOM Elements Access
    // ==============================================

    var productView_domElements = {
        name: document.getElementById("productView_name"),
        description: document.getElementById("productView_description_text"),
        sellerMessage: document.getElementById("productView_seller_message_text"),

        // Slider Elements
        sliderContainer: document.getElementById("productView_slider"),
        sliderTrack: document.getElementById("productView_slider_track"),
        sliderDots: document.getElementById("productView_slider_dots"),
        prevBtn: document.getElementById("productView_slider_prev"),
        nextBtn: document.getElementById("productView_slider_next")
    };


    // ==============================================
    //  3D Slider Logic
    // ==============================================

    let productView_sliderState = {
        currentIndex: 0,
        slides: [],
        dots: [],
        autoPlayInterval: null,
        images: []
    };

    /**
     * @function productView_buildSlider
     * @description Builds and renders the 3D image slider for the product.
     * @param {string[]} images - Array of image URLs.
     */
    function productView_buildSlider(images) {
        const { sliderTrack, sliderDots, prevBtn, nextBtn, sliderContainer } = productView_domElements;

        // Reset state
        productView_sliderState = {
            currentIndex: 0,
            slides: [],
            dots: [],
            autoPlayInterval: null,
            images: images
        };

        // Clear previous content
        sliderTrack.innerHTML = '';
        sliderDots.innerHTML = '';

        // Hide buttons temporarily
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';

        if (!images || images.length === 0) {
            sliderTrack.innerHTML = '<p style="text-align:center; color:#666; width:100%;">لا توجد صور للخدمة</p>';
            return;
        }

        // Create slides and dots
        images.forEach((imageUrl, index) => {
            // Slide
            const slide = document.createElement('div');
            slide.className = 'productView_slide';
            slide.style.backgroundImage = `url('${imageUrl}')`;

            // Pause/Play events
            slide.addEventListener('mousedown', productView_pauseAutoPlay);
            slide.addEventListener('mouseup', productView_startAutoPlay);
            slide.addEventListener('touchstart', productView_pauseAutoPlay, { passive: true });
            slide.addEventListener('touchend', productView_startAutoPlay);

            // Click side slide to activate
            slide.onclick = () => productView_goToSlide(index);

            sliderTrack.appendChild(slide);
            productView_sliderState.slides.push(slide);

            // Dot
            const dot = document.createElement('div');
            dot.className = 'productView_slider-dot';
            dot.onclick = (e) => {
                e.stopPropagation(); // Prevent click propagation
                productView_goToSlide(index);
            };
            sliderDots.appendChild(dot);
            productView_sliderState.dots.push(dot);
        });

        // Setup controls
        if (images.length > 1) {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';

            prevBtn.onclick = () => productView_goToSlide(productView_sliderState.currentIndex - 1);
            nextBtn.onclick = () => productView_goToSlide(productView_sliderState.currentIndex + 1);

            // Start auto play
            productView_startAutoPlay();
        } else {
            // Hide dots if only one image
            sliderDots.style.display = 'none';
        }

        // Show first slide
        productView_goToSlide(0);
    }

    /**
     * @function productView_goToSlide
     * @description Navigates to a specific slide with 3D effect.
     * @param {number} index - Index of the target slide.
     */
    function productView_goToSlide(index) {
        const { slides, dots } = productView_sliderState;
        if (slides.length === 0) return;

        // Calculate circular index
        const total = slides.length;
        const newIndex = (index + total) % total;
        productView_sliderState.currentIndex = newIndex;

        slides.forEach((slide, i) => {
            const directOffset = i - newIndex;
            // Calculate shortest distance in circular loop
            const wrapOffset = directOffset > 0 ? directOffset - total : directOffset + total;
            const offset = Math.abs(directOffset) < Math.abs(wrapOffset) ? directOffset : wrapOffset;

            const isActive = offset === 0;

            // Calculate transforms
            const translateX = offset * 40; // 40% offset
            const scale = isActive ? 1 : 0.7;
            const translateZ = -Math.abs(offset) * 50; // Depth

            slide.style.transform = `translateX(${translateX}%) translateZ(${translateZ}px) scale(${scale})`;

            // Update classes
            if (isActive) {
                slide.classList.add('active');
                slide.style.zIndex = 10;
            } else {
                slide.classList.remove('active');
                slide.style.zIndex = 1; // Lower values in back
            }
        });

        // Update dots
        dots.forEach((dot, i) => {
            if (i === newIndex) dot.classList.add('active');
            else dot.classList.remove('active');
        });

        // Reset timer
        if (slides.length > 1) {
            productView_resetAutoPlay();
        }
    }

    /**
     * @function productView_startAutoPlay
     * @description Starts the auto-play timer for the slider.
     */
    function productView_startAutoPlay() {
        if (productView_sliderState.images.length <= 1) return;
        if (productView_sliderState.autoPlayInterval) clearInterval(productView_sliderState.autoPlayInterval);
        productView_sliderState.autoPlayInterval = setInterval(() => {
            productView_goToSlide(productView_sliderState.currentIndex + 1);
        }, 4000);
    }

    /**
     * @function productView_pauseAutoPlay
     * @description Pauses the auto-play timer.
     */
    function productView_pauseAutoPlay() {
        if (productView_sliderState.autoPlayInterval) clearInterval(productView_sliderState.autoPlayInterval);
    }

    /**
     * @function productView_resetAutoPlay
     * @description Resets the auto-play timer (pause then start).
     */
    function productView_resetAutoPlay() {
        productView_pauseAutoPlay();
        productView_startAutoPlay();
    }

    // ==============================================
    //  Image Compression Logic
    // ==============================================
    const IMAGE_MAX_WIDTH = 1920;
    const IMAGE_MAX_HEIGHT = 1920;
    const IMAGE_QUALITY = 0.8;

    const WEBP_SUPPORTED_PROMISE = (async () => {
        const canvas = document.createElement('canvas');
        if (!!(canvas.getContext && canvas.getContext('2d'))) {
            return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        }
        return false;
    })();

    /**
     * @function compressImage
     * @description Compresses an image file and converts it to WebP if supported.
     * @param {File} file - The image file to compress.
     * @returns {Promise<Blob>} The compressed image blob.
     */
    async function compressImage(file) {
        // Create an ImageBitmap from the file
        // Note: createImageBitmap does not support all formats in all browsers (e.g. TIF might fail here).
        // If it fails, we return the original file as fallback.
        let imgBitmap;
        try {
            imgBitmap = await createImageBitmap(file);
        } catch (e) {
            console.warn("فشل ضغط الصورة، العودة للنسخة الأصلية", e);
            return file; // Return original if cannot parse
        }

        const width = imgBitmap.width;
        const height = imgBitmap.height;

        // Calculate new dimensions
        const ratio = Math.min(1, IMAGE_MAX_WIDTH / width, IMAGE_MAX_HEIGHT / height);
        const newWidth = Math.round(width * ratio);
        const newHeight = Math.round(height * ratio);

        // Draw to canvas
        const canvas = Object.assign(document.createElement('canvas'), { width: newWidth, height: newHeight });
        const ctx = canvas.getContext('2d');

        // Fill white background (avoids black transparents if converting png->jpg)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newWidth, newHeight);

        ctx.drawImage(imgBitmap, 0, 0, newWidth, newHeight);

        const webpSupported = await WEBP_SUPPORTED_PROMISE;
        const mime = webpSupported ? 'image/webp' : 'image/jpeg';

        // Convert to blob
        const blob = await new Promise((res) => canvas.toBlob(res, mime, IMAGE_QUALITY));

        // Cleanup
        try { imgBitmap.close(); } catch (e) { }

        // Attach useful metadata to blob
        blob.name = file.name; // Keep original name reference
        blob.lastModified = file.lastModified;

        // Mark as compressed/converted
        blob.isCompressed = true;
        blob.extension = webpSupported ? 'webp' : 'jpg';

        return blob;
    }


    // ==============================================
    //  Main Function
    // ==============================================

    /**
     * @function productView_viewDetails
     * @description Displays product details and initializes the slider.
     * @param {object} productData - The product data object.
     */
    function productView_viewDetails(productData, options = {}) {
        try {
            console.log("[productView_] عرض تفاصيل الخدمة مع السلايدر...");
            const showAddToCart = options.showAddToCart !== false;
            if (!showAddToCart) {
                document.getElementById("productView_order_box").style.display = "none";
            }
            const { name, description, sellerMessage } = productView_domElements;

            name.textContent = productData.productName || "غير متوفر";
            description.textContent = productData.description || "لا يوجد وصف متاح.";
            sellerMessage.textContent = productData.sellerMessage || "لا توجد رسالة من مقدم الخدمة.";

            // Build slider
            const images = productData.imageSrc || [];
            productView_buildSlider(images);

        } catch (error) {
            console.error("productView_viewDetails - خطأ:", error);

        }
    }

    // ==============================================
    //  Order Photo Logic
    // ==============================================

    let productView_orderImages = []; // Stores file objects
    const MAX_ORDER_IMAGES = 4;
    const MAX_IMAGE_SIZE_MB = 5;

    // Elements
    const productView_orderEls = {
        note: document.getElementById('productView_note'),
        uploader: document.getElementById('productView_uploader_area'),
        fileInput: document.getElementById('productView_fileInput'),
        pickBtn: document.getElementById('productView_pickImgBtn'),
        camBtn: document.getElementById('productView_camBtn'),
        previews: document.getElementById('productView_previews'),
        sendBtn: document.getElementById('productView_sendBtn')
    };

    /**
     * @function productView_initOrderLogic
     * @description Initializes listeners and state for the photo order request form.
     */
    function productView_initOrderLogic() {
        // Reset state
        productView_orderImages = [];
        productView_orderEls.note.value = '';
        productView_orderEls.previews.innerHTML = '';
        productView_orderEls.fileInput.value = '';

        // Event Listeners
        productView_orderEls.pickBtn.onclick = () => productView_orderEls.fileInput.click();

        productView_orderEls.fileInput.onchange = (e) => {
            productView_handleFiles(Array.from(e.target.files));
        };

        productView_orderEls.camBtn.onclick = () => {
            // Simple camera triggering for mobile
            if (/Mobi|Android/i.test(navigator.userAgent)) {
                productView_orderEls.fileInput.setAttribute('capture', 'environment');
                productView_orderEls.fileInput.click();
            } else {
                Swal.fire('تنبيه', 'يرجى استخدام زر اختيار الملفات على الكمبيوتر', 'info');
            }
        };

        productView_orderEls.sendBtn.onclick = productView_sendOrder;

        // check Drag and drop (Optional, but good UX)
        productView_orderEls.uploader.ondragover = (e) => { e.preventDefault(); productView_orderEls.uploader.style.borderColor = 'var(--primary-color)'; };
        productView_orderEls.uploader.ondragleave = (e) => { e.preventDefault(); productView_orderEls.uploader.style.borderColor = '#dee2e6'; };
        productView_orderEls.uploader.ondrop = (e) => {
            e.preventDefault();
            productView_orderEls.uploader.style.borderColor = '#dee2e6';
            productView_handleFiles(Array.from(e.dataTransfer.files));
        };
    }

    /**
     * @function productView_handleFiles
     * @description Processes selected files (validation, compression, preview).
     * @param {File[]} files - Array of selected files.
     */
    async function productView_handleFiles(files) {
        // Allowed extensions (Web-supported) - Relaxed because we try to compress
        // If it's an image that the browser can decode, it will be compressed/converted.

        if (productView_orderImages.length + files.length > MAX_ORDER_IMAGES) {
            Swal.fire('تنبيه', `الحد الأقصى هو ${MAX_ORDER_IMAGES} صور`, 'warning');
            return;
        }

        // Processing
        Swal.fire({
            title: 'جاري معالجة الصور...',
            didOpen: () => Swal.showLoading(),
            allowOutsideClick: false
        });

        for (const file of files) {
            // Check basics
            if (file.type.indexOf('image') === -1 && !file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|tif|tiff)$/i)) {
                // Skip non-images
                continue;
            }

            try {
                const processedBlob = await compressImage(file);
                // Ensure name property exists
                if (!processedBlob.name) processedBlob.name = file.name;

                productView_orderImages.push(processedBlob);
                productView_createPreview(processedBlob);
            } catch (err) {
                console.error("خطأ في معالجة الملف", file.name, err);

            }
        }

        Swal.close();
        productView_orderEls.fileInput.value = ''; // Reset
    }

    /**
     * @function productView_createPreview
     * @description Creates a visual preview for an uploaded image.
     * @param {Blob} file - The image blob to preview.
     */
    function productView_createPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'productView_preview_item';
            div.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button class="productView_preview_remove" onclick="productView_removeImage(this, '${file.name}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            // Store file reference if needed, but here simple index or removing from array is fine. 
            // Better: Re-render or map DOM to array. For simplicity, we just find index by file object (reference) but file object might be tricky.
            // Let's attach file object to the div
            div.fileRef = file;
            productView_orderEls.previews.appendChild(div);
        };
        reader.readAsDataURL(file);
    }

    /**
     * @function productView_removeImage
     * @description Removes an image from the order list and DOM (Global/Window).
     * @param {HTMLElement} btn - The remove button element.
     * @param {string} fileName - Name of the file (unused in logic but good for debug).
     */
    window.productView_removeImage = (btn, fileName) => {
        const div = btn.parentElement;
        const file = div.fileRef;
        productView_orderImages = productView_orderImages.filter(f => f !== file);
        div.remove();
    };

    /**
     * @function productView_sendOrder
     * @description Submits the new order request with notes and images.
     */
    async function productView_sendOrder() {
        // Validation
        if (showLoginAlert()) {



            const note = productView_orderEls.note.value.trim();
            if (productView_orderImages.length === 0 && !note) {
                Swal.fire('تنبيه', 'يرجى إضافة ملاحظة أو صورة واحدة على الأقل', 'warning');
                return;
            }

            // 1. Setup Keys
            // User provided data shows 'user_key' is the seller's key in productSession[0]
            const productData = productSession[0];
            const product_key = productData.product_key; // PRODUCTKEY (From Product Data)
            const seller_key = productData.user_key;     // sellerKey (From Product Data)

            const user_key = userSession.user_key;       // USERKEY (From User Session)

            // Show loading
            Swal.fire({
                title: 'جاري الإرسال...',
                html: 'يرجى الانتظار بينما نقوم برفع الصور وإنشاء الطلب',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            try {
                console.log("بدء إرسال الطلب...");

                // 2. Generate Order Key (Serial) - For Database PK only
                const order_key = generateSerial();

                // 3. Upload Images
                const uploadedFileNames = [];

                for (let i = 0; i < productView_orderImages.length; i++) {
                    const file = productView_orderImages[i];
                    const index = i + 1;
                    // Get extension from compressed blob (if available) or fallback to name
                    // This converts .tif -> .webp/.jpg automatically in the filename
                    const ext = (file.extension || file.name.split('.').pop() || 'jpg').toLowerCase();

                    // Naming: USERKEY_sellerKey_PRODUCTKEY_ORDERKEY_{index}
                    // Using explicit product_key as requested + order_key for uniqueness
                    const newName = `${user_key}_${seller_key}_${product_key}_${order_key}_${index}`;
                    const finalName = `${newName}.${ext}`;
                    console.log(`جارٍ رفع ${finalName}...`);

                    const uploadResult = await uploadFile2cf(file, finalName);
                    // Use the file name confirmed by server if available, otherwise use our generated name
                    // Note: uploadFile2cf returns { file: "filename", ... } on success usually
                    const actualName = uploadResult.file || finalName;
                    uploadedFileNames.push(actualName);
                    console.log(`تم الرفع بنجاح: ${actualName}`);
                }

                // 4. Create Order in Database
                const total_amount = 0;

                const orderData = {
                    order_key: order_key,
                    user_key: user_key,
                    total_amount: total_amount,
                    items: [
                        {
                            product_key: product_key,
                            quantity: 1,
                            seller_key: seller_key,
                            note: note
                        }
                    ]
                };

                console.log("إنشاء الطلب:", orderData);

                const res = await fetch(`${baseURL}/api/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (!res.ok) {
                    throw new Error('فشل إنشاء الطلب');
                }

                // Success
                localStorage.setItem('showOrderPhotoMessage', 'true');

                Swal.fire({
                    icon: 'success',
                    title: 'تم الإرسال بنجاح',

                    confirmButtonText: 'حسناً'
                }).then(() => {
                    mainLoader("./pages/home.html", "index-home-container", 0, undefined, "hiddenHomeIcon", false);

                });

            } catch (error) {
                console.error(error);

            }
        }
    }




    // ==============================================
    //  Entry Point
    // ==============================================

    try {
        console.log("تهيئة عرض الخدمة سلايدر ثلاثي الأبعاد...");
        // Check session and clear old intervals if any
        if (typeof productView_sliderState !== 'undefined' && productView_sliderState.autoPlayInterval) {
            clearInterval(productView_sliderState.autoPlayInterval);
        }

        // Get product data from state manager (new approach)
        const productData = ProductStateManager.getCurrentProduct();
        const viewOptions = ProductStateManager.getViewOptions();

        if (productData) {
            productView_viewDetails(productData, viewOptions);
        } else {
            // Fallback to old approach for backward compatibility
            console.warn("[productView2] لم يتم العثور على بيانات في State Manager، استخدام productSession");
            if (productSession) {
                productView_viewDetails(productSession[0], productSession[1]);
            } else {
                console.error("[productView2] لا توجد بيانات منتج للعرض");
            }
        }

        // Initialize Order Logic
        productView_initOrderLogic();

    } catch (error) {
        console.error("خطأ في تهيئة عرض الخدمة:", error);
    }
