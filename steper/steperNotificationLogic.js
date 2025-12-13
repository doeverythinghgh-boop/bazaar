/**
 * @file steperNotificationLogic.js
 * @description Notification Logic Module for Steper.
 * Contains functions to prepare notification data and check conditions for sending them.
 */

import { ITEM_STATUS } from "./config.js";
import { getAllItemsStatus } from "./stateManagement.js";

/**
 * Extracts unique keys (delivery, seller) and metadata from orders data.
 * @function extractNotificationMetadata
 * @param {Array<object>} ordersData
 * @param {object} controlData
 * @returns {object} Metadata object { buyerKey, deliveryKeys, sellerKeys, orderId, userName }.
 */
export function extractNotificationMetadata(ordersData, controlData) {
    let buyerKey = '';
    let deliveryKeys = [];
    let sellerKeys = [];
    let orderId = '';
    let userName = '';

    if (ordersData && ordersData.length > 0) {
        const firstOrder = ordersData[0];
        buyerKey = firstOrder.user_key || '';
        orderId = firstOrder.id || firstOrder.order_id || '';

        const deliveryKeysSet = new Set();
        const sellerKeysSet = new Set();

        ordersData.forEach(order => {
            if (order.order_items && Array.isArray(order.order_items)) {
                order.order_items.forEach(item => {
                    if (item.supplier_delivery && item.supplier_delivery.delivery_key) {
                        const dKey = item.supplier_delivery.delivery_key;
                        if (Array.isArray(dKey)) {
                            dKey.forEach(k => { if (k) deliveryKeysSet.add(k); });
                        } else if (dKey) {
                            deliveryKeysSet.add(dKey);
                        }
                    }
                    if (item.seller_key) sellerKeysSet.add(item.seller_key);
                });
            }
        });
        deliveryKeys = Array.from(deliveryKeysSet);
        sellerKeys = Array.from(sellerKeysSet);
    }

    if (controlData.currentUser) {
        userName = controlData.currentUser.name || controlData.currentUser.idUser || '';
    }

    return { buyerKey, deliveryKeys, sellerKeys, orderId, userName };
}

/**
 * Checks for sub-step conditions (Cancelled, Rejected, Returned products) and prepares notification data.
 * @function checkSubStepConditions
 * @param {string} activatedStepId - The ID of the main step just activated.
 * @param {object} metadata - Metadata extracted via extractNotificationMetadata.
 * @returns {object|null} Notification payload for notifyOnSubStepActivation or null.
 */
export function checkSubStepConditions(activatedStepId, metadata) {
    const itemsMap = getAllItemsStatus();
    const allItems = Object.values(itemsMap);

    if (activatedStepId === 'step-review') {
        const hasCancelled = allItems.some(i => i.status === ITEM_STATUS.CANCELLED);
        if (hasCancelled) {
            return {
                stepId: 'step-cancelled',
                stepName: 'ملغي',
                sellerKeys: metadata.sellerKeys,
                orderId: metadata.orderId,
                userName: metadata.userName
            };
        }
    } else if (activatedStepId === 'step-confirmed') {
        const hasRejected = allItems.some(i => i.status === ITEM_STATUS.REJECTED);
        if (hasRejected) {
            return {
                stepId: 'step-rejected',
                stepName: 'مرفوض',
                buyerKey: metadata.buyerKey,
                orderId: metadata.orderId,
                userName: metadata.userName
            };
        }
    } else if (activatedStepId === 'step-delivered') {
        const hasReturned = allItems.some(i => i.status === ITEM_STATUS.RETURNED);
        if (hasReturned) {
            return {
                stepId: 'step-returned',
                stepName: 'مرتجع',
                sellerKeys: metadata.sellerKeys,
                orderId: metadata.orderId,
                userName: metadata.userName
            };
        }
    }

    return null;
}
