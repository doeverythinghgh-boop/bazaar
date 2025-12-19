/**
 * @file buyerPopups.js
 * @description Buyer Popups Controller (Main Entry Point).
 * This file orchestrates buyer-related interactions by re-exporting from specialized modules.
 */

// Re-export everything from sub-modules to maintain backward compatibility
export { attachLogButtonListeners } from "./buyerPopups/utils.js";
export { handleReviewSave, showProductKeysAlert } from "./buyerPopups/review.js";
export { handleDeliverySave, showDeliveryConfirmationAlert } from "./buyerPopups/delivery.js";
export {
    showBuyerRejectedProductsAlert,
    showUnselectedProductsAlert,
    showReturnedProductsAlert,
    showBuyerConfirmedProductsAlert,
    showBuyerShippingInfoAlert,
    showCourierConfirmedProductsAlert
} from "./buyerPopups/statusViews.js";
