/**
 * @file steper/sellerPopups/statusViews.js
 * @description Controllers for Read-Only status views in the Seller workflow.
 */

import { getRejectedProducts } from "../sellerLogic.js";
import { generateRejectedListHtml } from "../sellerUi.js";
import { getDeliveryProducts, getReturnedProducts, getUserDetailsForDelivery } from "../buyerLogic.js";
import { generateDeliveryUserInfoHtml, generateDeliveryItemsHtml, generateReturnedListHtml } from "../buyerUi.js";
import { attachLogButtonListeners } from "./utils.js";
import SwalProxy from "../swalProxy.js";

/**
 * Displays products rejected by the seller.
 * @function showSellerRejectedProductsAlert
 * @param {object} data
 * @param {Array<object>} ordersData
 */
export function showSellerRejectedProductsAlert(data, ordersData) {
    try {
        const rejectedProducts = getRejectedProducts(ordersData, data.currentUser.idUser, data.currentUser.type);
        const htmlContent = generateRejectedListHtml(rejectedProducts);

        SwalProxy.fire({
            title: "المنتجات المرفوضة",
            html: `<div id="seller-rejected-container">${htmlContent}</div>`,
            confirmButtonText: "حسنًا",
            customClass: { popup: "fullscreen-swal" },
            didOpen: () => attachLogButtonListeners()
        });
    } catch (error) {
        console.error("Error in showSellerRejectedProductsAlert:", error);
    }
}

/**
 * Displays product receipt confirmation (Delivered Step) for the Seller (Read-Only).
 * @function showSellerDeliveryConfirmationAlert
 * @param {object} data
 * @param {Array<object>} ordersData
 */
export function showSellerDeliveryConfirmationAlert(data, ordersData) {
    try {
        const userId = data.currentUser.idUser;
        const userType = data.currentUser.type;

        // Reuse buyer logic which already filters by seller_key for "seller" type
        const productsToDeliver = getDeliveryProducts(ordersData, userId, userType);

        if (productsToDeliver.length === 0) {
            SwalProxy.fire({
                title: "لا توجد منتجات تم توصيلها/شحنها",
                text: "لا توجد منتجات في مرحلة التوصيل.",
                confirmButtonText: "إغلاق",
                customClass: { popup: "fullscreen-swal" },
            });
            return;
        }

        let userInfoHtml = "";
        if (userType !== 'seller') {
            const userDetails = getUserDetailsForDelivery(productsToDeliver, ordersData);
            userInfoHtml = generateDeliveryUserInfoHtml(userDetails);
        }
        const checkboxesHtml = generateDeliveryItemsHtml(productsToDeliver);

        SwalProxy.fire({
            title: "تأكيد استلام المنتجات (قراءة فقط)",
            html: `<div id="seller-delivery-container" style="display: flex; flex-direction: column; align-items: start; width: 100%;">
                    ${userInfoHtml}
                    ${checkboxesHtml}
                   </div>`,
            confirmButtonText: "إغلاق",
            customClass: { popup: "fullscreen-swal" },
            didOpen: () => {
                attachLogButtonListeners();
                // Disable all inputs to make it read-only
                const popup = SwalProxy.getPopup();
                const inputs = popup.querySelectorAll('input, select, textarea');
                inputs.forEach(input => input.disabled = true);
            },
        });
    } catch (error) {
        console.error("Error in showSellerDeliveryConfirmationAlert:", error);
    }
}

/**
 * Displays returned products (Returned Step) for the Seller (Read-Only).
 * @function showSellerReturnedProductsAlert
 * @param {object} data
 * @param {Array<object>} ordersData
 */
export function showSellerReturnedProductsAlert(data, ordersData) {
    try {
        const userId = data.currentUser.idUser;
        const userType = data.currentUser.type;

        const returnedKeys = getReturnedProducts(ordersData, userId, userType);
        const htmlContent = generateReturnedListHtml(returnedKeys, ordersData);

        SwalProxy.fire({
            title: "المنتجات المرتجعة (قراءة فقط)",
            html: `<div id="seller-returned-container">${htmlContent}</div>`,
            confirmButtonText: "إغلاق",
            customClass: { popup: "fullscreen-swal" },
            didOpen: () => {
                attachLogButtonListeners();
            }
        });
    } catch (error) {
        console.error("Error in showSellerReturnedProductsAlert:", error);
    }
}
