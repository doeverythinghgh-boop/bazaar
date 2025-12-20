/**
 * @file core.js
 * @description Core lifecycle and initialization logic for the location application.
 * orchestrates the startup sequence of the application.
 * 
 * @author Antigravity
 * @version 1.0.0
 */

/**
 * Initialize the application components and services
 * @memberof location_app
 * @returns {void}
 */
location_app.init = function () {
    try {
        console.log("[Core] Initializing components...");
        this.location_showLoading(true);

        console.log("[Core] -> Setting up Map...");
        this.location_initMap();

        console.log("[Core] -> Setting up Listeners...");
        this.location_setupEventListeners();

        console.log("[Core] -> Loading Initial Position...");
        this.location_loadInitialLocation();

        setTimeout(() => {
            this.location_showLoading(false);
        }, 500);

        console.log('Location application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize location application:', error);
        this.location_showAlert('خطأ في التهيئة', 'حدث خطأ أثناء تحميل التطبيق. يرجى تحديث الصفحة.', 'error');
    }
};
