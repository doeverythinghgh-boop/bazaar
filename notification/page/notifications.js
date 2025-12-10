/**
 * @file notifications.js
 * @description منطق صفحة عرض الإشعارات
 */

// كائن إدارة صفحة الإشعارات
const NotificationPage = {
    /**
     * @description البيانات الحالية للصفحة
     * @type {object}
     */
    state: {
        notifications: [],
        filteredNotifications: [],
        isLoading: false,
        hasError: false,
        errorMessage: '',
        totalCount: 0,
        stats: {
            total: 0,
            unread: 0,
            sent: 0,
            received: 0
        }
    },
    
    /**
     * @description إعدادات التصفية
     * @type {object}
     */
    filters: {
        type: 'all',        // all, sent, received
        status: 'all',      // all, read, unread
        search: '',         // نص البحث
        sortBy: 'newest'    // newest, oldest
    },
    
    /**
     * @description إعدادات التحديث
     * @type {object}
     */
    refreshSettings: {
        autoRefresh: true,
        refreshInterval: 30000, // 30 ثانية
        refreshTimer: null
    },
    
    /**
     * @description عناصر DOM
     * @type {object}
     */
    elements: {},
    
    /**
     * @description تهيئة الصفحة
     * @async
     */
    async init() {
        console.log('[Notifications] تهيئة صفحة الإشعارات...');
        
        try {
            // تهيئة عناصر DOM
            this.initElements();
            
            // تحميل الإعدادات المحفوظة
            this.loadSettings();
            
            // إعداد مستمعي الأحداث
            this.setupEventListeners();
            
            // إعداد العداد العالمي
            this.setupGlobalCounter();
            
            // تحديث العداد العالمي عند فتح الصفحة
            if (window.GLOBAL_NOTIFICATIONS) {
                window.GLOBAL_NOTIFICATIONS.resetCounter();
            }
            
            // تحميل الإشعارات الأولى
            await this.loadNotifications();
            
            // بدء التحديث التلقائي
            this.startAutoRefresh();
            
            console.log('[Notifications] تم تهيئة الصفحة بنجاح');
        } catch (error) {
            console.error('[Notifications] خطأ في التهيئة:', error);
            this.showError('خطأ في تهيئة صفحة الإشعارات');
        }
    },
    
    /**
     * @description تهيئة عناصر DOM
     */
    initElements() {
        this.elements = {
            // الحاويات
            container: document.getElementById('notifications-container'),
            list: document.getElementById('notifications-list'),
            stats: document.getElementById('notifications-stats'),
            emptyState: document.getElementById('empty-state'),
            loadingState: document.getElementById('loading-state'),
            errorState: document.getElementById('error-state'),
            
            // أدوات التحكم
            filterType: document.getElementById('filter-type'),
            filterStatus: document.getElementById('filter-status'),
            searchInput: document.getElementById('search-input'),
            sortSelect: document.getElementById('sort-select'),
            refreshBtn: document.getElementById('refresh-btn'),
            autoRefreshToggle: document.getElementById('auto-refresh-toggle'),
            markAllReadBtn: document.getElementById('mark-all-read-btn'),
            clearFiltersBtn: document.getElementById('clear-filters-btn'),
            
            // الإحصائيات
            totalCountEl: document.getElementById('total-count'),
            unreadCountEl: document.getElementById('unread-count'),
            sentCountEl: document.getElementById('sent-count'),
            receivedCountEl: document.getElementById('received-count')
        };
    },
    
    /**
     * @description تحميل الإعدادات من localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('notification_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                
                // تطبيق الإعدادات
                if (settings.filters) {
                    this.filters = { ...this.filters, ...settings.filters };
                    this.applyFilterValues();
                }
                
                if (settings.refreshSettings) {
                    this.refreshSettings.autoRefresh = settings.refreshSettings.autoRefresh;
                    this.updateAutoRefreshToggle();
                }
            }
        } catch (error) {
            console.warn('[Notifications] خطأ في تحميل الإعدادات:', error);
        }
    },
    
    /**
     * @description حفظ الإعدادات في localStorage
     */
    saveSettings() {
        try {
            const settings = {
                filters: this.filters,
                refreshSettings: {
                    autoRefresh: this.refreshSettings.autoRefresh
                }
            };
            localStorage.setItem('notification_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('[Notifications] خطأ في حفظ الإعدادات:', error);
        }
    },
    
    /**
     * @description تطبيق قيم الفلاتر على عناصر DOM
     */
    applyFilterValues() {
        if (this.elements.filterType) {
            this.elements.filterType.value = this.filters.type;
        }
        if (this.elements.filterStatus) {
            this.elements.filterStatus.value = this.filters.status;
        }
        if (this.elements.searchInput) {
            this.elements.searchInput.value = this.filters.search;
        }
        if (this.elements.sortSelect) {
            this.elements.sortSelect.value = this.filters.sortBy;
        }
    },
    
    /**
     * @description تحديث زر التحديث التلقائي
     */
    updateAutoRefreshToggle() {
        if (this.elements.autoRefreshToggle) {
            this.elements.autoRefreshToggle.checked = this.refreshSettings.autoRefresh;
            this.elements.autoRefreshToggle.nextElementSibling.textContent = 
                this.refreshSettings.autoRefresh ? 'مفعل' : 'معطل';
        }
    },
    
    /**
     * @description إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // أحداث التصفية
        if (this.elements.filterType) {
            this.elements.filterType.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.applyFilters();
                this.saveSettings();
            });
        }
        
        if (this.elements.filterStatus) {
            this.elements.filterStatus.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
                this.saveSettings();
            });
        }
        
        if (this.elements.searchInput) {
            // بحث فوري مع debounce
            let searchTimeout;
            this.elements.searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filters.search = e.target.value.trim();
                    this.applyFilters();
                    this.saveSettings();
                }, 300);
            });
        }
        
        if (this.elements.sortSelect) {
            this.elements.sortSelect.addEventListener('change', (e) => {
                this.filters.sortBy = e.target.value;
                this.applyFilters();
                this.saveSettings();
            });
        }
        
        // أحداث الأزرار
        if (this.elements.refreshBtn) {
            this.elements.refreshBtn.addEventListener('click', () => {
                this.refreshNotifications();
            });
        }
        
        if (this.elements.autoRefreshToggle) {
            this.elements.autoRefreshToggle.addEventListener('change', (e) => {
                this.refreshSettings.autoRefresh = e.target.checked;
                if (this.refreshSettings.autoRefresh) {
                    this.startAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
                this.updateAutoRefreshToggle();
                this.saveSettings();
            });
        }
        
        if (this.elements.markAllReadBtn) {
            this.elements.markAllReadBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }
        
        if (this.elements.clearFiltersBtn) {
            this.elements.clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
        
        // حدث إضافة إشعار جديد
        window.addEventListener('notificationLogAdded', async (event) => {
            console.log('[Notifications] حدث إشعار جديد:', event.detail);
            await this.handleNewNotification(event.detail);
        });
        
        // تحديث عند عودة الصفحة للتركيز
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshNotifications();
            }
        });
    },
    
    /**
     * @description إعداد العداد العالمي
     */
    setupGlobalCounter() {
        if (window.GLOBAL_NOTIFICATIONS) {
            window.GLOBAL_NOTIFICATIONS.onCountUpdate = (count) => {
                if (this.elements.unreadCountEl) {
                    this.elements.unreadCountEl.textContent = count;
                }
            };
        }
    },
    
    /**
     * @description تحميل الإشعارات من IndexedDB
     * @async
     */
    async loadNotifications() {
        this.setState({ isLoading: true, hasError: false });
        
        try {
            // التأكد من تهيئة قاعدة البيانات
            if (typeof initDB === 'function') {
                await initDB();
            }
            
            // جلب الإشعارات
            const notifications = await getNotificationLogs('all', 1000);
            
            // تحديث الحالة
            this.setState({
                notifications: notifications,
                isLoading: false,
                hasError: false
            });
            
            // تحديث الإحصائيات
            this.updateStats(notifications);
            
            // تطبيق الفلاتر
            this.applyFilters();
            
        } catch (error) {
            console.error('[Notifications] خطأ في جلب الإشعارات:', error);
            this.setState({
                isLoading: false,
                hasError: true,
                errorMessage: 'فشل في تحميل الإشعارات. تأكد من اتصالك بالإنترنت.'
            });
        }
    },
    
    /**
     * @description تحديث الإشعارات
     * @async
     */
    async refreshNotifications() {
        if (this.state.isLoading) return;
        
        // إضافة تأثير للزر
        if (this.elements.refreshBtn) {
            this.elements.refreshBtn.classList.add('refreshing');
            setTimeout(() => {
                this.elements.refreshBtn.classList.remove('refreshing');
            }, 1000);
        }
        
        await this.loadNotifications();
    },
    
    /**
     * @description بدء التحديث التلقائي
     */
    startAutoRefresh() {
        this.stopAutoRefresh(); // إيقاف أي مؤقت سابق
        
        if (this.refreshSettings.autoRefresh) {
            this.refreshSettings.refreshTimer = setInterval(() => {
                this.refreshNotifications();
            }, this.refreshSettings.refreshInterval);
            
            console.log('[Notifications] تم تفعيل التحديث التلقائي');
        }
    },
    
    /**
     * @description إيقاف التحديث التلقائي
     */
    stopAutoRefresh() {
        if (this.refreshSettings.refreshTimer) {
            clearInterval(this.refreshSettings.refreshTimer);
            this.refreshSettings.refreshTimer = null;
            console.log('[Notifications] تم إيقاف التحديث التلقائي');
        }
    },
    
    /**
     * @description تحديث إحصائيات الصفحة
     * @param {Array} notifications
     */
    updateStats(notifications) {
        const stats = {
            total: notifications.length,
            unread: notifications.filter(n => n.status === 'unread').length,
            sent: notifications.filter(n => n.type === 'sent').length,
            received: notifications.filter(n => n.type === 'received').length
        };
        
        this.state.stats = stats;
        
        // تحديث واجهة المستخدم
        if (this.elements.totalCountEl) {
            this.elements.totalCountEl.textContent = stats.total;
        }
        if (this.elements.unreadCountEl) {
            this.elements.unreadCountEl.textContent = stats.unread;
        }
        if (this.elements.sentCountEl) {
            this.elements.sentCountEl.textContent = stats.sent;
        }
        if (this.elements.receivedCountEl) {
            this.elements.receivedCountEl.textContent = stats.received;
        }
        
        // تحديث العداد العالمي
        if (window.GLOBAL_NOTIFICATIONS) {
            window.GLOBAL_NOTIFICATIONS.unreadCount = stats.unread;
            window.GLOBAL_NOTIFICATIONS.updateBrowserTitle();
        }
    },
    
    /**
     * @description تطبيق الفلاتر
     */
    applyFilters() {
        let filtered = [...this.state.notifications];
        
        // فلترة حسب النوع
        if (this.filters.type !== 'all') {
            filtered = filtered.filter(n => n.type === this.filters.type);
        }
        
        // فلترة حسب الحالة
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(n => n.status === this.filters.status);
        }
        
        // فلترة حسب البحث
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(n => 
                (n.title && n.title.toLowerCase().includes(searchTerm)) ||
                (n.body && n.body.toLowerCase().includes(searchTerm)) ||
                (n.relatedUser && n.relatedUser.name && n.relatedUser.name.toLowerCase().includes(searchTerm))
            );
        }
        
        // ترتيب النتائج
        filtered.sort((a, b) => {
            const dateA = new Date(a.timestamp);
            const dateB = new Date(b.timestamp);
            return this.filters.sortBy === 'newest' ? dateB - dateA : dateA - dateB;
        });
        
        this.state.filteredNotifications = filtered;
        this.renderNotifications();
    },
    
    /**
     * @description مسح جميع الفلاتر
     */
    clearFilters() {
        this.filters = {
            type: 'all',
            status: 'all',
            search: '',
            sortBy: 'newest'
        };
        
        this.applyFilterValues();
        this.applyFilters();
        this.saveSettings();
    },
    
    /**
     * @description عرض الإشعارات في واجهة المستخدم
     */
    renderNotifications() {
        if (!this.elements.list) return;
        
        // إظهار/إخفاء الحالات المختلفة
        if (this.state.isLoading) {
            this.showLoading();
            return;
        }
        
        if (this.state.hasError) {
            this.showError();
            return;
        }
        
        if (this.state.filteredNotifications.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // إخفاء الحالات
        this.hideAllStates();
        
        // إنشاء عناصر الإشعارات
        this.elements.list.innerHTML = '';
        
        this.state.filteredNotifications.forEach(notification => {
            const notificationElement = this.createNotificationElement(notification);
            this.elements.list.appendChild(notificationElement);
        });
    },
    
    /**
     * @description إنشاء عنصر إشعار
     * @param {object} notification
     * @returns {HTMLElement}
     */
    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = `notification-item ${notification.status === 'unread' ? 'unread' : ''}`;
        element.dataset.id = notification.id;
        
        // تنسيق التاريخ
        const date = new Date(notification.timestamp);
        const timeAgo = this.formatTimeAgo(date);
        const formattedDate = date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // أيقونة حسب النوع
        const icon = notification.type === 'sent' ? 'fa-paper-plane' : 'fa-bell';
        
        element.innerHTML = `
            <div class="notification-header">
                <div class="notification-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="notification-info">
                    <h4 class="notification-title">${this.escapeHtml(notification.title || 'بدون عنوان')}</h4>
                    <div class="notification-meta">
                        <span class="notification-time" title="${formattedDate}">
                            <i class="far fa-clock"></i> ${timeAgo}
                        </span>
                        <span class="notification-type ${notification.type}">
                            ${notification.type === 'sent' ? 'مرسل' : 'مستلم'}
                        </span>
                        ${notification.relatedUser ? 
                            `<span class="notification-user">
                                <i class="fas fa-user"></i> ${this.escapeHtml(notification.relatedUser.name || 'مستخدم')}
                            </span>` : ''
                        }
                    </div>
                </div>
                <div class="notification-actions">
                    ${notification.status === 'unread' ? 
                        `<button class="btn-mark-read" title="تحديد كمقروء">
                            <i class="fas fa-circle"></i>
                        </button>` : ''
                    }
                    <button class="btn-toggle-details" title="عرض التفاصيل">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
            </div>
            <div class="notification-body">
                <p class="notification-content">${this.escapeHtml(notification.body || 'بدون محتوى')}</p>
                <div class="notification-details" style="display: none;">
                    <div class="details-grid">
                        <div class="detail-item">
                            <span class="detail-label">المعرف:</span>
                            <span class="detail-value">${notification.id}</span>
                        </div>
                        ${notification.messageId ? 
                            `<div class="detail-item">
                                <span class="detail-label">معرف الرسالة:</span>
                                <span class="detail-value">${notification.messageId}</span>
                            </div>` : ''
                        }
                        <div class="detail-item">
                            <span class="detail-label">التاريخ الكامل:</span>
                            <span class="detail-value">${formattedDate}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">الحالة:</span>
                            <span class="detail-value status-${notification.status}">
                                ${notification.status === 'unread' ? 'غير مقروء' : 'مقروء'}
                            </span>
                        </div>
                    </div>
                    ${notification.payload ? 
                        `<div class="notification-payload">
                            <h5>البيانات الإضافية:</h5>
                            <pre>${JSON.stringify(notification.payload, null, 2)}</pre>
                        </div>` : ''
                    }
                </div>
            </div>
        `;
        
        // إضافة مستمعي الأحداث
        const toggleBtn = element.querySelector('.btn-toggle-details');
        const detailsDiv = element.querySelector('.notification-details');
        
        toggleBtn.addEventListener('click', () => {
            const isExpanded = detailsDiv.style.display !== 'none';
            detailsDiv.style.display = isExpanded ? 'none' : 'block';
            toggleBtn.innerHTML = isExpanded ? 
                '<i class="fas fa-chevron-down"></i>' : 
                '<i class="fas fa-chevron-up"></i>';
        });
        
        const markReadBtn = element.querySelector('.btn-mark-read');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.markAsRead(notification.id, element);
            });
        }
        
        // عند النقر على الإشعار، نفتح التفاصيل
        element.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-toggle-details') && !e.target.closest('.btn-mark-read')) {
                const clickEvent = new Event('click');
                toggleBtn.dispatchEvent(clickEvent);
            }
        });
        
        return element;
    },
    
    /**
     * @description تحديث حالة الإشعار كمقروء
     * @param {number} id
     * @param {HTMLElement} element
     * @async
     */
    async markAsRead(id, element) {
        try {
            // هنا تحتاج لتحديث السجل في IndexedDB
            // هذا يتطلب إضافة دالة updateNotificationStatus في notification-db-manager.js
            console.log('[Notifications] تحديث حالة الإشعار كمقروء:', id);
            
            // تحديث الواجهة مؤقتاً
            element.classList.remove('unread');
            const markReadBtn = element.querySelector('.btn-mark-read');
            if (markReadBtn) {
                markReadBtn.remove();
            }
            
            // تحديث الإحصائيات
            this.state.stats.unread = Math.max(0, this.state.stats.unread - 1);
            if (this.elements.unreadCountEl) {
                this.elements.unreadCountEl.textContent = this.state.stats.unread;
            }
            
            // تحديث العداد العالمي
            if (window.GLOBAL_NOTIFICATIONS) {
                window.GLOBAL_NOTIFICATIONS.unreadCount = Math.max(0, window.GLOBAL_NOTIFICATIONS.unreadCount - 1);
                window.GLOBAL_NOTIFICATIONS.notifyCountUpdate();
                window.GLOBAL_NOTIFICATIONS.updateBrowserTitle();
            }
            
        } catch (error) {
            console.error('[Notifications] خطأ في تحديث حالة الإشعار:', error);
        }
    },
    
    /**
     * @description تحديد جميع الإشعارات كمقروءة
     * @async
     */
    async markAllAsRead() {
        if (!confirm('هل تريد تحديد جميع الإشعارات كمقروءة؟')) return;
        
        try {
            // تحديث جميع الإشعارات في الواجهة
            document.querySelectorAll('.notification-item.unread').forEach(item => {
                item.classList.remove('unread');
                const markReadBtn = item.querySelector('.btn-mark-read');
                if (markReadBtn) {
                    markReadBtn.remove();
                }
            });
            
            // تحديث الإحصائيات
            this.state.stats.unread = 0;
            if (this.elements.unreadCountEl) {
                this.elements.unreadCountEl.textContent = '0';
            }
            
            // تحديث العداد العالمي
            if (window.GLOBAL_NOTIFICATIONS) {
                window.GLOBAL_NOTIFICATIONS.unreadCount = 0;
                window.GLOBAL_NOTIFICATIONS.notifyCountUpdate();
                window.GLOBAL_NOTIFICATIONS.updateBrowserTitle();
            }
            
            // إظهار رسالة نجاح
            this.showToast('تم تحديد جميع الإشعارات كمقروءة', 'success');
            
        } catch (error) {
            console.error('[Notifications] خطأ في تحديد الكل كمقروء:', error);
            this.showToast('حدث خطأ أثناء العملية', 'error');
        }
    },
    
    /**
     * @description معالجة إشعار جديد
     * @param {object} notification
     * @async
     */
    async handleNewNotification(notification) {
        // تحديث الإشعارات إذا كانت الصفحة مفتوحة
        if (!document.hidden) {
            // إضافة الإشعار الجديد للقائمة
            this.state.notifications.unshift(notification);
            
            // تحديث الإحصائيات
            this.updateStats(this.state.notifications);
            
            // تطبيق الفلاتر
            this.applyFilters();
            
            // إظهار toast
            this.showToast('تم استقبال إشعار جديد', 'info');
        }
    },
    
    /**
     * @description تحديث حالة الصفحة
     * @param {object} newState
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
    },
    
    /**
     * @description إظهار حالة التحميل
     */
    showLoading() {
        this.hideAllStates();
        if (this.elements.loadingState) {
            this.elements.loadingState.style.display = 'block';
        }
        if (this.elements.list) {
            this.elements.list.style.display = 'none';
        }
    },
    
    /**
     * @description إظهار حالة الخطأ
     */
    showError(message) {
        this.hideAllStates();
        if (this.elements.errorState) {
            this.elements.errorState.style.display = 'block';
            if (message && this.elements.errorState.querySelector('.error-message')) {
                this.elements.errorState.querySelector('.error-message').textContent = message;
            }
        }
        if (this.elements.list) {
            this.elements.list.style.display = 'none';
        }
    },
    
    /**
     * @description إظهار حالة فارغة
     */
    showEmptyState() {
        this.hideAllStates();
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'block';
        }
        if (this.elements.list) {
            this.elements.list.style.display = 'none';
        }
    },
    
    /**
     * @description إخفاء جميع الحالات
     */
    hideAllStates() {
        if (this.elements.loadingState) {
            this.elements.loadingState.style.display = 'none';
        }
        if (this.elements.errorState) {
            this.elements.errorState.style.display = 'none';
        }
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'none';
        }
        if (this.elements.list) {
            this.elements.list.style.display = 'block';
        }
    },
    
    /**
     * @description إظهار رسالة toast
     * @param {string} message
     * @param {string} type
     */
    showToast(message, type = 'info') {
        // إنشاء عنصر toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                               type === 'error' ? 'fa-exclamation-circle' : 
                               'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        // إضافة إلى الصفحة
        document.body.appendChild(toast);
        
        // إضافة مستمعي الأحداث
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });
        
        // إزالة تلقائية بعد 3 ثوان
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    },
    
    /**
     * @description تنسيق الوقت منذ الحدث
     * @param {Date} date
     * @returns {string}
     */
    formatTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffDay > 0) {
            return `قبل ${diffDay} يوم`;
        } else if (diffHour > 0) {
            return `قبل ${diffHour} ساعة`;
        } else if (diffMin > 0) {
            return `قبل ${diffMin} دقيقة`;
        } else {
            return 'الآن';
        }
    },
    
    /**
     * @description حماية النص من HTML Injection
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// تهيئة الصفحة عند تحميل DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        NotificationPage.init();
    });
} else {
    NotificationPage.init();
}