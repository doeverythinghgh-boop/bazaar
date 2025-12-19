/**
 * @file steper/buyerPopups/utils.js
 * @description Utility functions for Buyer Popups.
 */

/**
 * Attaches listeners to "Show Product" buttons.
 * @function attachLogButtonListeners
 */
export function attachLogButtonListeners() {
    document.querySelectorAll('.btn-show-key').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Product Key (Button):', button.dataset.key);
            localStorage.setItem('productKeyFromStepReview', button.dataset.key);
        });
    });
}
