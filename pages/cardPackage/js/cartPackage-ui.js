/**
 * @file pages/cardPackage/js/cartPackage-ui.js
 * @description UI rendering and display logic for cart package.
 * Handles cart display, item rendering, and summary updates.
 */

/**
 * @description Loads the cart items from local storage and renders them in the cart page.
 *   Updates the cart summary and handles empty cart state.
 * @function cartPage_loadCart
 * @returns {void}
 */
function cartPage_loadCart() {
    try {
        const cartPage_cartItemsContainer = document.getElementById('cartPage_cartItemsContainer');
        const cartPage_emptyCart = document.getElementById('cartPage_emptyCart');
        const cartPage_cartSummary = document.getElementById('cartPage_cartSummary');

        // فحص دفاعي: إذا لم تكن العناصر موجودة، فهذا يعني أننا لسنا في صفحة السلة
        if (!cartPage_cartItemsContainer || !cartPage_emptyCart || !cartPage_cartSummary) {
            return;
        }

        const cartPage_cart = getCart();

        if (cartPage_cart.length === 0) {
            cartPage_cartItemsContainer.innerHTML = '';
            cartPage_emptyCart.style.display = 'block';
            cartPage_cartSummary.style.display = 'none';
            return;
        }

        cartPage_emptyCart.style.display = 'none';
        cartPage_cartSummary.style.display = 'block';

        let cartPage_cartItemsHTML = '';

        cartPage_cart.forEach(cartPage_item => {
            const cartPage_discount = cartPage_item.original_price && cartPage_item.original_price > cartPage_item.price
                ? Math.round(((cartPage_item.original_price - cartPage_item.price) / cartPage_item.original_price) * 100)
                : 0;

            const cartPage_savings = cartPage_item.original_price && cartPage_item.original_price > cartPage_item.price
                ? (cartPage_item.original_price - cartPage_item.price) * cartPage_item.quantity
                : 0;

            cartPage_cartItemsHTML += `
                <table class="cartPage_cart-item" id="cartPage_cartItem-${cartPage_item.product_key}" data-product-key="${cartPage_item.product_key}">
                    <tbody>
                        <tr>
                            <td style="width: 120px;" id="cartPage_cartItemImage-${cartPage_item.product_key}">
                                <div class="cartPage_cart-item-image">
                                    <img id="cartPage_cartItemImg-${cartPage_item.product_key}" src="${cartPage_item.image || 'https://via.placeholder.com/120x120?text=No+Image'}" 
                                         alt="${cartPage_item.productName}">
                                </div>
                            </td>
                            <td id="cartPage_cartItemInfo-${cartPage_item.product_key}">
                                <div class="cartPage_cart-item-info">
                                    <h3 class="cartPage_cart-item-title" id="cartPage_cartItemTitle-${cartPage_item.product_key}">${cartPage_item.productName}</h3>
                                    <div class="cartPage_cart-item-price" id="cartPage_cartItemPriceContainer-${cartPage_item.product_key}">
                                        <span class="cartPage_current-price" id="cartPage_currentPrice-${cartPage_item.product_key}">${cartPage_item.price.toFixed(2)} ج.م</span>
                                        ${cartPage_item.original_price && cartPage_item.original_price > cartPage_item.price ?
                    `<span class="cartPage_original-price" id="cartPage_originalPrice-${cartPage_item.product_key}">${cartPage_item.original_price.toFixed(2)} ج.م</span>` : ''}
                                        ${cartPage_discount > 0 ?
                    `<span class="cartPage_discount-badge" id="cartPage_discountBadge-${cartPage_item.product_key}">توفير ${cartPage_discount}%</span>` : ''}
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" id="cartPage_cartItemNoteContainer-${cartPage_item.product_key}">
                                <div class="cartPage_cart-item-note">
                                    <div class="cartPage_note-label" id="cartPage_noteLabel-${cartPage_item.product_key}">
                                        <i class="fas fa-sticky-note"></i>
                                        <span>ملاحظاتك:</span>
                                    </div>
                                    <div class="cartPage_note-text ${cartPage_item.note ? '' : 'empty'}" id="cartPage_noteText-${cartPage_item.product_key}">
                                        ${cartPage_item.note || 'لا توجد ملاحظات'}
                                        <button class="cartPage_edit-note-btn" id="cartPage_editNoteBtn-${cartPage_item.product_key}" data-product-key="${cartPage_item.product_key}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td id="cartPage_quantityControls-${cartPage_item.product_key}">
                                <div class="cartPage_quantity-controls">
                                    <button class="cartPage_quantity-btn cartPage_minus" id="cartPage_decreaseQtyBtn-${cartPage_item.product_key}" data-product-key="${cartPage_item.product_key}">-</button>
                                    <input type="number" class="cartPage_quantity-input" id="cartPage_quantityInput-${cartPage_item.product_key}"
                                           value="${cartPage_item.quantity}" min="1" 
                                           data-product-key="${cartPage_item.product_key}">
                                    <button class="cartPage_quantity-btn cartPage_plus" id="cartPage_increaseQtyBtn-${cartPage_item.product_key}" data-product-key="${cartPage_item.product_key}">+</button>
                                </div>
                            </td>
                            <td id="cartPage_removeBtn-${cartPage_item.product_key}">
                                <button class="cartPage_remove-btn" data-product-key="${cartPage_item.product_key}">
                                    <i class="fas fa-trash"></i> حذف
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;
        });

        cartPage_cartItemsContainer.innerHTML = cartPage_cartItemsHTML;
        cartPage_updateCartSummary();
    } catch (error) {
        console.error('حدث خطأ أثناء تحميل السلة:', error);
    }
}

/**
 * @description Updates the cart summary section with the total item count, subtotal, savings, and final total.
 * @function cartPage_updateCartSummary
 * @returns {void}
 */
function cartPage_updateCartSummary() {
    try {
        const cartPage_itemCount = getCartItemCount();
        const cartPage_subtotal = getCartTotalPrice();
        const cartPage_savings = getCartTotalSavings();
        const cartPage_deliveryFee = 40.00;
        const cartPage_total = cartPage_subtotal + cartPage_deliveryFee;

        document.getElementById('cartPage_itemCount').textContent = cartPage_itemCount;
        document.getElementById('cartPage_subtotal').textContent = cartPage_subtotal.toFixed(2) + ' ج.م';
        document.getElementById('cartPage_savings').textContent = cartPage_savings.toFixed(2) + ' ج.م';
        document.getElementById('cartPage_deliveryFee').textContent = cartPage_deliveryFee.toFixed(2) + ' ج.م';
        document.getElementById('cartPage_total').textContent = cartPage_total.toFixed(2) + ' ج.م';
    } catch (error) {
        console.error('حدث خطأ أثناء تحديث ملخص السلة:', error);
    }
}
