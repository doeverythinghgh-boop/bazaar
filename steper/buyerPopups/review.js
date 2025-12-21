/**
 * @file steper/buyerPopups/review.js
 * @description Controller for the Review Step in the Buyer workflow.
 */

import { ITEM_STATUS } from "../config.js";
import { loadItemStatus, saveItemStatus } from "../stateManagement.js";
import { updateCurrentStepFromState } from "../uiUpdates.js";
import { getProductsForReview } from "../buyerLogic.js";
import { generateReviewListHtml } from "../buyerUi.js";
import { extractNotificationMetadata, extractRelevantSellerKeys } from "../steperNotificationLogic.js";
import { attachLogButtonListeners } from "./utils.js";
import SwalProxy from "../swalProxy.js";

/**
 * Handles saving review changes.
 * @function handleReviewSave
 * @param {object} data
 * @param {Array<object>} ordersData
 */
export async function handleReviewSave(data, ordersData) {
    const container = document.getElementById("buyer-review-products-container");
    if (!container) return; // Guard clause
    const checkboxes = container.querySelectorAll('input[name="productKeys"]');

    const updates = [];

    checkboxes.forEach(cb => {
        if (!cb.disabled) {
            const newStatus = cb.checked ? ITEM_STATUS.PENDING : ITEM_STATUS.CANCELLED;
            const currentStatus = loadItemStatus(cb.value);
            if (currentStatus !== newStatus) {
                updates.push({ key: cb.value, status: newStatus });
            }
        }
    });

    if (updates.length > 0) {
        // Show loading state
        SwalProxy.fire({
            title: 'جاري الحفظ...',
            text: 'برجاء الانتظار بينما يتم حفظ التغييرات.',
            allowOutsideClick: false,
            didOpen: () => {
                SwalProxy.showLoading();
            }
        });

        try {
            // Execute all updates (Blocking)
            await Promise.all(updates.map(u => saveItemStatus(u.key, u.status)));

            SwalProxy.fire({
                title: 'تم التحديث',
                text: 'تم تحديث اختيار المنتجات بنجاح.',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                updateCurrentStepFromState(data, ordersData);

                // [Notifications] Dispatch Notifications
                if (typeof window.notifyOnStepActivation === 'function') {
                    const metadata = extractNotificationMetadata(ordersData, data);

                    // 1. Notify Review/Pending (Generic Update) - Optional, maybe just for Cancelled
                    // 2. Notify Cancelled
                    const hasCancelled = updates.some(u => u.status === ITEM_STATUS.CANCELLED);
                    if (hasCancelled) {
                        const relevantSellers = extractRelevantSellerKeys(updates, ordersData);
                        window.notifyOnStepActivation({
                            stepId: 'step-cancelled',
                            stepName: 'منتجات ملغاة',
                            ...metadata,
                            sellerKeys: relevantSellers
                        });
                    }
                }
            });
        } catch (error) {
            SwalProxy.fire({
                title: 'فشل الحفظ',
                text: 'حدث خطأ أثناء حفظ البيانات. برجاء المحاولة مرة أخرى.',
                confirmButtonText: 'حسنًا'
            });
        }
    } else {
        SwalProxy.close();
    }
}

/**
 * Displays a popup for the buyer to review products and select what they want to order.
 * @function showProductKeysAlert
 * @param {object} data - Control Data.
 * @param {Array<object>} ordersData - Orders Data.
 * @param {boolean} isModificationLocked - Is modification locked.
 */
export function showProductKeysAlert(data, ordersData, isModificationLocked) {
    try {
        const userId = data.currentUser.idUser;
        const userType = data.currentUser.type;

        // Use Logic module to get data
        const productKeys = getProductsForReview(ordersData, userId, userType);

        const isOverallLocked = isModificationLocked || (userType !== "buyer" && userType !== "admin");

        console.log(`[BuyerPopup] showProductKeysAlert | User: ${userId} (${userType}) | Products: ${productKeys.length} | Locked: ${isOverallLocked}`);

        // Use UI module to generate HTML
        const htmlContent = generateReviewListHtml(productKeys, ordersData, isOverallLocked);

        SwalProxy.fire({
            title: isOverallLocked ? "عرض المنتجات" : "اختر المنتجات:",
            html: `<div id="buyer-review-products-container" style="display: flex; flex-direction: column; align-items: start; width: 100%;">${htmlContent}</div>`,
            footer: isOverallLocked
                ? "للمشاهدة فقط - التعديلات مقيدة."
                : '<button id="btn-save-review" class="swal2-confirm swal2-styled" style="background-color: #28a745;">حفظ الاختيارات</button>',
            cancelButtonText: "إغلاق",
            focusConfirm: false,
            allowOutsideClick: !isOverallLocked,
            showConfirmButton: false,
            showCancelButton: true,
            customClass: { popup: "fullscreen-swal" },
            didOpen: () => {
                attachLogButtonListeners();
                if (!isOverallLocked) {
                    document.getElementById('btn-save-review')?.addEventListener('click', () => {
                        handleReviewSave(data, ordersData);
                    });
                }
            },
        });
    } catch (error) {
        console.error("Error in showProductKeysAlert:", error);
    }
}
