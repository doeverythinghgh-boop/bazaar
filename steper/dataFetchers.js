/**
 * @file dataFetchers.js
 * @description Data Fetching Module.
 * Wraps synchronous configuration data in Promises to maintain
 * asynchronous interface compatibility with the rest of the application.
 */

import { appDataControl, ordersData } from "./config.js";

/**
 * Retrieves the application control data.
 * @returns {Promise<Object>} Resolves with the control data object.
 */
export function fetchControlData() {
    return Promise.resolve(appDataControl);
}

/**
 * Retrieves the orders data.
 * @returns {Promise<Array<Object>>} Resolves with the orders data array.
 */
export function fetchOrdersData() {
    return Promise.resolve(ordersData);
}
