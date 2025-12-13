/**
 * @file pages/ADMIN/pendingProducts.js
 * @description Logic for fetching, displaying, approving, and rejecting pending products.
 */

async function fetchPendingProducts() {
    const listContainer = document.getElementById('pending-products-list');
    listContainer.innerHTML = '<div class="loader" style="margin: 50px auto;"></div>';

    try {
        // Fetch products with status=0 (pending)
        const response = await fetch(`${baseURL}/api/products?status=0`);
        if (!response.ok) throw new Error('فشل جلب المنتجات المعلقة');

        const products = await response.json();

        if (!products || products.length === 0) {
            listContainer.innerHTML = `
                <div class="no-pending-products">
                    <i class="fas fa-check-circle" style="font-size: 3em; color: #28a745; margin-bottom: 20px;"></i>
                    <p>لا توجد منتجات معلقة حالياً.</p>
                </div>
            `;
            return;
        }

        renderPendingProducts(products);

    } catch (error) {
        console.error('Error fetching pending products:', error);
        listContainer.innerHTML = `<p style="color: red; text-align: center;">حدث خطأ أثناء تحميل المنتجات: ${error.message}</p>`;
    }
}

function renderPendingProducts(products) {
    const listContainer = document.getElementById('pending-products-list');
    listContainer.innerHTML = '';

    products.forEach(product => {
        const firstImage = product.ImageName ? product.ImageName.split(',')[0] : null;
        const imageUrl = firstImage
            ? `https://pub-e828389e2f1e484c89d8fb652c540c12.r2.dev/${firstImage}`
            : 'images/placeholder.png';

        const card = document.createElement('div');
        card.className = 'pending-product-card';
        card.id = `card-${product.product_key}`;

        card.innerHTML = `
            <img src="${imageUrl}" alt="Product Image" class="pending-product-image">
            
            <div class="pending-product-details">
                <div class="pending-product-title">${product.productName}</div>
                <div class="pending-product-info"><strong>البائع:</strong> ${product.seller_username || 'غير معروف'} (${product.seller_phone || '-'})</div>
                <div class="pending-product-info"><strong>السعر:</strong> ${product.product_price} ج.م</div>
                <div class="pending-product-info"><strong>التصنيف:</strong> ${getCategoryName(product.MainCategory)}</div>
                <div class="pending-product-info" style="font-size: 0.85em; color: #888; margin-top: 5px;">${product.product_description.substring(0, 100)}...</div>
            </div>

            <div class="pending-product-actions">
                <button class="btn-approve" onclick="approveProduct('${product.product_key}', '${product.productName}')">
                    <i class="fas fa-check"></i> موافقة
                </button>
                <button class="btn-reject" onclick="rejectProduct('${product.product_key}', '${product.productName}')">
                    <i class="fas fa-times"></i> رفض
                </button>
                 <button class="btn-view" onclick="viewPendingProduct('${product.product_key}')">
                    <i class="fas fa-eye"></i> معاينة
                </button>
            </div>
        `;

        listContainer.appendChild(card);
    });
}

// Helper to get category name (Simplified map, ideally fetching from list.json)
function getCategoryName(id) {
    // This is a placeholder since we don't have easy synchronous access to list.json here
    // You could enhance this by passing categories map or fetching it.
    return `ID: ${id}`;
}

async function approveProduct(productKey, productName) {
    const confirmResult = await Swal.fire({
        title: 'تأكيد الموافقة',
        text: `هل أنت متأكد من الموافقة على نشر "${productName}"؟`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'نعم، وافق ونشر',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#28a745'
    });

    if (!confirmResult.isConfirmed) return;

    try {
        Swal.showLoading();
        const response = await fetch(`${baseURL}/api/products`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_key: productKey,
                is_approved: 1 // Set to approved
            })
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'فشل التحديث');

        Swal.fire({
            icon: 'success',
            title: 'تم النشر بنجاح',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });

        // Remove card from UI
        const card = document.getElementById(`card-${productKey}`);
        if (card) {
            card.style.transition = 'all 0.5s';
            card.style.opacity = '0';
            setTimeout(() => card.remove(), 500);
        }

        // Check if empty
        if (document.querySelectorAll('.pending-product-card').length <= 1) {
            fetchPendingProducts(); // Reload to show empty state
        }

    } catch (error) {
        console.error(error);
        Swal.fire('خطأ', error.message, 'error');
    }
}

async function rejectProduct(productKey, productName) {
    const confirmResult = await Swal.fire({
        title: 'رفض المنتج',
        text: `هل تريد حذف "${productName}" نهائياً؟`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، حذف',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#dc3545'
    });

    if (!confirmResult.isConfirmed) return;

    try {
        Swal.showLoading();
        const response = await fetch(`${baseURL}/api/products?product_key=${productKey}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'فشل الحذف');

        Swal.fire({
            icon: 'success',
            title: 'تم الرفض والحذف',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });

        const card = document.getElementById(`card-${productKey}`);
        if (card) {
            card.style.transition = 'all 0.5s';
            card.style.opacity = '0';
            setTimeout(() => card.remove(), 500);
        }

        if (document.querySelectorAll('.pending-product-card').length <= 1) {
            fetchPendingProducts();
        }

    } catch (error) {
        console.error(error);
        Swal.fire('خطأ', error.message, 'error');
    }
}

async function viewPendingProduct(productKey) {
    try {
        // We can use the productView logic
        // First fetch full details (though we might already have them, good to be safe)
        const response = await fetch(`${baseURL}/api/products?product_key=${productKey}&status=0`); // explicitly ask for status=0 in case logic requires
        const productData = await response.json();

        if (!productData) {
            Swal.fire('خطأ', 'تعذر تحميل تفاصيل المنتج', 'error');
            return;
        }

        const productDataForModal = {
            product_key: productData.product_key,
            productName: productData.productName,
            user_key: productData.user_key,
            pricePerItem: productData.product_price,
            original_price: productData.original_price,
            imageSrc: productData.ImageName ? productData.ImageName.split(',').map(name => `https://pub-e828389e2f1e484c89d8fb652c540c12.r2.dev/${name}`) : [],
            availableQuantity: productData.product_quantity,
            sellerMessage: productData.user_message,
            description: productData.product_description,
            sellerName: productData.seller_username,
            sellerPhone: productData.seller_phone,
            MainCategory: productData.MainCategory,
            SubCategory: productData.SubCategory,
            type: productData.serviceType
        };

        // Use global variable `productSession` and `productViewLayout` if available
        // Or show a simple Swal for details
        if (typeof productViewLayout === 'function') {
            window.productSession = [productDataForModal, true];
            // Load productView2.html manually if needed or call layout directly
            // Assuming productViewLayout switches view. 
            // Ideally we load the view first.
            console.log("Opening preview for", productDataForModal);
            productViewLayout(productData.serviceType);
        } else {
            Swal.fire({
                title: productData.productName,
                text: productData.product_description,
                imageUrl: productDataForModal.imageSrc[0]
            });
        }

    } catch (e) {
        console.error(e);
    }
}

// Initial fetch
fetchPendingProducts();
