/**
 * @file swalProxy.js
 * @description Proxy for SweetAlert2 to ensure popups appear in the parent window context if available.
 * This prevents popups from being trapped/clipped inside an iframe.
 */

/**
 * Gets the best available Swal instance (Parent window or local).
 * @returns {object} Swal instance
 */
function getSwal() {
    try {
        if (window.parent && window.parent.Swal) {
            return window.parent.Swal;
        }
    } catch (e) {
        // Cross-origin issues might prevent access
        console.warn("[SwalProxy] Cannot access parent Swal, using local.");
    }
    return window.Swal;
}

/**
 * Proxy object for Swal methods.
 */
export const SwalProxy = {
    fire: (...args) => getSwal().fire(...args),
    close: (...args) => getSwal().close(...args),
    showLoading: (...args) => getSwal().showLoading(...args),
    getPopup: (...args) => getSwal().getPopup(...args),
    isVisible: (...args) => getSwal().isVisible(...args),
    clickConfirm: (...args) => getSwal().clickConfirm(...args),
    clickCancel: (...args) => getSwal().clickCancel(...args),
    enableButtons: (...args) => getSwal().enableButtons(...args),
    disableButtons: (...args) => getSwal().disableButtons(...args),
};

export default SwalProxy;
