/**
 * @file sellerPopups.js
 * @description Seller Popups Controller (Main Entry Point).
 * This file orchestrates seller-related interactions by re-exporting from specialized modules.
 */

// Re-export everything from sub-modules to maintain backward compatibility
export { attachLogButtonListeners } from "./sellerPopups/utils.js";
export { handleConfirmationSave, showSellerConfirmationProductsAlert } from "./sellerPopups/confirmation.js";
export { handleShippingSave, showShippingInfoAlert } from "./sellerPopups/shipping.js";
export {
    showSellerRejectedProductsAlert,
    showSellerDeliveryConfirmationAlert,
    showSellerReturnedProductsAlert
} from "./sellerPopups/statusViews.js";
