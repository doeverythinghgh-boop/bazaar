/**
 * @file js/PRODUCT_SERVICE/productStateManager.js
 * @description Centralized state management for product operations.
 * Replaces global variables with a clean, encapsulated API.
 */

/**
 * @description Product State Manager - Centralized state management for product operations.
 * @namespace ProductStateManager
 */
const ProductStateManager = {
    /**
     * @description Private state object.
     * @private
     * @type {object}
     */
    _state: {
        currentProduct: null,
        selectedCategories: null,
        viewOptions: null
    },

    /**
     * @description Set product data for viewing/editing.
     * @function setProductForView
     * @param {object} productData - Product data object.
     * @param {object} [options={}] - View options (showAddToCart, etc).
     * @returns {void}
     */
    setProductForView(productData, options = {}) {
        this._state.currentProduct = productData;
        this._state.viewOptions = options;
        console.log('[ProductState] تم تعيين بيانات المنتج:', productData);
    },

    /**
     * @description Get current product data.
     * @function getCurrentProduct
     * @returns {object|null} Current product data or null.
     */
    getCurrentProduct() {
        return this._state.currentProduct;
    },

    /**
     * @description Get view options.
     * @function getViewOptions
     * @returns {object} View options object.
     */
    getViewOptions() {
        return this._state.viewOptions || {};
    },

    /**
     * @description Set selected categories for add/edit operations.
     * @function setSelectedCategories
     * @param {number} mainId - Main category ID.
     * @param {number} subId - Sub category ID.
     * @returns {void}
     */
    setSelectedCategories(mainId, subId) {
        this._state.selectedCategories = { mainId, subId };
        console.log('[ProductState] تم تعيين الفئات المختارة:', { mainId, subId });
    },

    /**
     * @description Get selected categories.
     * @function getSelectedCategories
     * @returns {object|null} Selected categories object or null.
     */
    getSelectedCategories() {
        return this._state.selectedCategories;
    },

    /**
     * @description Clear all state.
     * @function clear
     * @returns {void}
     */
    clear() {
        this._state = {
            currentProduct: null,
            selectedCategories: null,
            viewOptions: null
        };
        console.log('[ProductState] تم مسح جميع البيانات');
    },

    /**
     * @description Get current state (for debugging).
     * @function getState
     * @returns {object} Current state object.
     */
    getState() {
        return { ...this._state };
    }
};

// Make it globally available
window.ProductStateManager = ProductStateManager;
