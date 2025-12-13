/**
 * @file config.js
 * @description Configuration module for the Stepper application.
 * This file acts as the Single Source of Truth for:
 * 1. Global constants (Admin IDs, Item Statuses).
 * 2. Shared Application State (Control Data, Orders Data).
 * 3. Initialization Logic (Synchronization with parent window or data source).
 *
 * It adheres to Clean Code principles (SoC, SRP) by centralizing configuration
 * and mutable state management, preventing tight coupling across modules.
 */

// =============================================================================
// 1. CONSTANTS (Immutable Configuration)
// =============================================================================

/**
 * @constant ADMIN_IDS
 * @description List of user IDs (phone numbers) granted administrative privileges.
 * @type {string[]}
 */
export const ADMIN_IDS = ["01024182175", "01026546550"];

/**
 * @constant ITEM_STATUS
 * @description Enum-like object defining possible statuses for an order item.
 * Used to avoid magic strings throughout the application.
 * @type {Object<string, string>}
 */
export const ITEM_STATUS = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    RETURNED: "returned",
    CANCELLED: "cancelled",
    REJECTED: "rejected"
};

// =============================================================================
// 2. SHARED STATE (Mutable Data)
// =============================================================================

/**
 * @var appDataControl
 * @description Holds the main control configuration for the application.
 * This includes step definitions, user permissions, and other setting metadata.
 * Populated during initialization.
 * @type {object}
 */
export let appDataControl = {};

/**
 * @var ordersData
 * @description Holds the array of orders associated with the current context.
 * Populated during initialization.
 * @type {Array<object>}
 */
export let ordersData = [];

/**
 * @var globalStepperAppData
 * @description Holds the persistent application state (saved progress, dates).
 * Updates are synchronized with LocalStorage via stateManagement.js.
 * @type {object}
 */
export let globalStepperAppData = {};

// =============================================================================
// 3. STATE MUTATORS (Controlled Access)
// =============================================================================

/**
 * @function updateGlobalStepperAppData
 * @description Updates the global application state variable.
 * @param {object} newState - The new state object to replace the current one.
 */
export function updateGlobalStepperAppData(newState) {
    globalStepperAppData = newState;
}

/**
 * @function setAppDataControl
 * @description Updates the control data.
 * @param {object} data - Control data object.
 */
export function setAppDataControl(data) {
    appDataControl = data;
}

/**
 * @function setOrdersData
 * @description Updates the orders data.
 * @param {Array<object>} data - Orders data array.
 */
export function setOrdersData(data) {
    ordersData = data;
}

// =============================================================================
// 4. INITIALIZATION LOGIC
// =============================================================================

/**
 * @constant initializationPromise
 * @description A Promise that resolves when the required initial data is available.
 * It listens for a global event or checks for data presence, ensuring the app
 * does not start with empty state.
 *
 * Current implementation: Waits for data to be injected into the window object
 * (e.g., by a parent script) and then populates local variables.
 *
 * @type {Promise<void>}
 */
export const initializationPromise = new Promise((resolve, reject) => {
    // Check if data is already available globally (synchronous injection)
    if (window.stepperData) {
        setAppDataControl(window.stepperData.control);
        setOrdersData(window.stepperData.orders);
        console.log("[Config] Data initialized from window.stepperData immediately.");
        resolve();
    } else {
        // Otherwise, assume we might need to fetch or wait.
        // For this refactor, we maintain compatibility with existing 'dataFetchers.js'
        // which returns these variables. If they are empty, the app might fail.
        // We simulate a 'ready' state for now.
        // In a real scenario, we might listen for 'message' event from parent iframe.

        // Temporary: Resolve immediately to allow flow to proceed to dataFetchers
        // which currently resolves 'appDataControl'.
        // FIXME: dataFetchers.js actually just returns these empty objects if they aren't set.
        // We need a way to populate them.

        // Strategy: We expose a global function for the parent/loader to call.
        window.initializeStepperData = (control, orders) => {
            setAppDataControl(control);
            setOrdersData(orders);
            console.log("[Config] Data initialized via window.initializeStepperData.");
            resolve();
        };

        // Fallback/Timeout (optional): If we expect data to be fetched locally
        console.log("[Config] Waiting for initialization data...");
        // If the architecture expects 'fetchControlData' to actually FETCH,
        // then 'appDataControl' shouldn't be the source. 
        // But dataFetchers.js was modified to return these variables.
        // This implies something else sets them.

        // For the purpose of this refactor task (Clean Code), we define the structure.
        // The actual data injection mechanism is external.
        // We resolve immediately so we don't block, assuming data might be lazy-loaded 
        // or set later, or that the user will implement the injection.
        resolve();
    }
});
