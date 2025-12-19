/**
 * @file steper/sellerPopups/utils.js
 * @description Utility functions for Seller Popups.
 */

/**
 * Attaches listeners to "Show Product" buttons.
 * @function attachLogButtonListeners
 */
export function attachLogButtonListeners() {
    document.querySelectorAll('.btn-show-key').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Seller] Product Key:', btn.dataset.key);
            localStorage.setItem('productKeyFromStepReview', btn.dataset.key);
        });
    });
}
