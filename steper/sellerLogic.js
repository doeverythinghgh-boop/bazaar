/**
 * @file sellerLogic.js
 * @description Seller Business Logic Module.
 * Contains pure functions for data processing related to seller interactions.
 */

import { loadItemStatus } from "./stateManagement.js";
import { ITEM_STATUS } from "./config.js";

/**
 * Parses delivery information from the item data.
 * @function parseDeliveryInfo
 * @param {object} deliveryData
 * @returns {Array<object>} Array of objects with name and phone.
 */
export function parseDeliveryInfo(deliveryData) {
    if (!deliveryData) return [];

    const names = deliveryData.delivery_name;
    const phones = deliveryData.delivery_phone;

    if (Array.isArray(names)) {
        return names.map((name, index) => {
            const phone = Array.isArray(phones) ? phones[index] : phones;
            return { name: name, phone: phone || 'N/A' };
        });
    } else if (names) {
        const phone = Array.isArray(phones) ? phones[0] : phones;
        return [{ name: names, phone: phone || 'N/A' }];
    } else if (deliveryData.delivery_key) {
        const key = Array.isArray(deliveryData.delivery_key) ? deliveryData.delivery_key.join(", ") : deliveryData.delivery_key;
        return [{ name: key, phone: 'N/A' }];
    }
    return [];
}

/**
 * Extracts and formats product data for the confirmation popup.
 * @function getConfirmationProducts
 * @param {Array<object>} ordersData
 * @param {string} sellerId
 * @param {string} userType
 * @returns {Array<object>} List of unique products with delivery info.
 */
export function getConfirmationProducts(ordersData, sellerId, userType) {
    if (!ordersData) return [];

    const sellerOwnedProducts = ordersData.flatMap((order) =>
        order.order_items
            .filter((item) => userType === "admin" || item.seller_key === sellerId)
            .map((item) => {
                return {
                    product_key: item.product_key,
                    product_name: item.product_name,
                    delivery_info: parseDeliveryInfo(item.supplier_delivery),
                    note: item.note || ''
                };
            })
    );

    // Remove duplicates based on product_key
    return Array.from(
        new Map(sellerOwnedProducts.map((p) => [p.product_key, p])).values()
    );
}

/**
 * Extracts rejected products for the seller.
 * @function getRejectedProducts
 * @param {Array<object>} ordersData
 * @param {string} sellerId
 * @param {string} userType
 * @returns {Array<object>} List of rejected products.
 */
export function getRejectedProducts(ordersData, sellerId, userType) {
    if (!ordersData) return [];

    return ordersData.flatMap(order =>
        order.order_items.filter(item => {
            const isOwner = userType === "admin" || item.seller_key === sellerId;
            const status = loadItemStatus(item.product_key);
            return isOwner && status === ITEM_STATUS.REJECTED;
        })
    );
}

/**
 * Extracts products eligible for shipping (Confirmed, Shipped, or Delivered).
 * @function getShippableProducts
 * @param {Array<object>} ordersData
 * @param {string} sellerId
 * @param {string} userType
 * @returns {Array<object>} List of shippable products.
 */
export function getShippableProducts(ordersData, sellerId, userType) {
    if (!ordersData) return [];

    return ordersData.flatMap((order) =>
        order.order_items
            .filter((item) => userType === "admin" || (userType === "seller" && item.seller_key === sellerId) || (userType === "courier"))
            .filter((item) => {
                const status = loadItemStatus(item.product_key);
                return status === ITEM_STATUS.CONFIRMED || status === ITEM_STATUS.SHIPPED || status === ITEM_STATUS.DELIVERED;
            })
            .map(item => ({
                ...item,
                delivery_info: parseDeliveryInfo(item.supplier_delivery)
            }))
    );
}
