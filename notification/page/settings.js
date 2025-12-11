/**
 * @file settings.js
 * @description المنطق الخاص بصفحة إعدادات الإشعارات. يتعامل مع تحميل وحفظ الإعدادات وعرض الجدول.
 * تم تحديث المتغيرات والدوال لتستخدم البادئة notifiSetting_ مع إضافة معالجة الأخطاء.
 */

// القيم الافتراضية كما تم تحديدها من قبل المستخدم
// القيم الافتراضية سيتم تحميلها من ملف JSON
let notifiSetting_DEFAULT_CONFIG = {};

const notifiSetting_STORAGE_KEY = 'notification_config';

const notifiSetting_Controller = {
    notifiSetting_config: {},

    async notifiSetting_init() {
        try {
            await this.notifiSetting_loadDefaults();
            this.notifiSetting_loadConfig();
            this.notifiSetting_renderTable();
            this.notifiSetting_setupEventListeners();
        } catch (notifiSetting_error) {
            console.error('حدث خطأ أثناء تهيئة إعدادات الإشعارات:', notifiSetting_error);
            this.notifiSetting_showToast('فشل تحميل الصفحة بشكل صحيح ❌');
        }
    },

    async notifiSetting_loadDefaults() {
        try {
            // Adjust path if necessary. Assuming notification_config.json is at root "/" or relative to this file.
            // Since this JS is in /notification/page/, and json is in /bazaar/ (root web), we use /notification_config.json
            const response = await fetch('/notification_config.json');
            if (!response.ok) throw new Error('Failed to load configuration file');
            notifiSetting_DEFAULT_CONFIG = await response.json();
            console.log('تم تحميل الإعدادات الافتراضية من JSON:', notifiSetting_DEFAULT_CONFIG);
        } catch (error) {
            console.error('فشل تحميل ملف الإعدادات JSON:', error);
            this.notifiSetting_showToast('فشل تحميل ملف الإعدادات الافتراضية ⚠️');
            // Empty defaults or hardcoded fallback could go here if needed
            notifiSetting_DEFAULT_CONFIG = {};
        }
    },

    notifiSetting_loadConfig() {
        try {
            const notifiSetting_stored = localStorage.getItem(notifiSetting_STORAGE_KEY);
            if (notifiSetting_stored) {
                try {
                    // دمج الإعدادات المخزنة مع الافتراضيات لضمان صحة الهيكل
                    const notifiSetting_parsed = JSON.parse(notifiSetting_stored);
                    this.notifiSetting_config = { ...notifiSetting_DEFAULT_CONFIG };

                    // تحديث القيم المنطقية فقط، والإبقاء على التسميات من الكود/JSON
                    for (const notifiSetting_key in notifiSetting_parsed) {
                        if (this.notifiSetting_config[notifiSetting_key]) {
                            this.notifiSetting_config[notifiSetting_key] = {
                                ...this.notifiSetting_config[notifiSetting_key],
                                buyer: notifiSetting_parsed[notifiSetting_key].buyer,
                                admin: notifiSetting_parsed[notifiSetting_key].admin,
                                seller: notifiSetting_parsed[notifiSetting_key].seller,
                                delivery: notifiSetting_parsed[notifiSetting_key].delivery
                            };
                        }
                    }
                } catch (notifiSetting_parseError) {
                    console.error('خطأ في تحليل الإعدادات، التراجع إلى الافتراضي', notifiSetting_parseError);
                    this.notifiSetting_config = JSON.parse(JSON.stringify(notifiSetting_DEFAULT_CONFIG));
                }
            } else {
                // نسخة عميقة من الافتراضيات
                this.notifiSetting_config = JSON.parse(JSON.stringify(notifiSetting_DEFAULT_CONFIG));
            }
        } catch (notifiSetting_error) {
            console.error('حدث خطأ أثناء تحميل الإعدادات:', notifiSetting_error);
        }
    },

    notifiSetting_saveConfig() {
        try {
            localStorage.setItem(notifiSetting_STORAGE_KEY, JSON.stringify(this.notifiSetting_config));
            this.notifiSetting_showToast('تم حفظ الإعدادات بنجاح ✅');
            console.log('[notifiSetting] Config saved:', this.notifiSetting_config);
        } catch (notifiSetting_error) {
            console.error('حدث خطأ أثناء حفظ الإعدادات:', notifiSetting_error);
            this.notifiSetting_showToast('فشل حفظ الإعدادات ❌');
        }
    },

    notifiSetting_resetDefaults() {
        try {
            if (confirm('هل أنت متأكد من استعادة الافتراضيات؟')) {
                this.notifiSetting_config = JSON.parse(JSON.stringify(notifiSetting_DEFAULT_CONFIG));
                this.notifiSetting_saveConfig();
                this.notifiSetting_renderTable();
            }
        } catch (notifiSetting_error) {
            console.error('حدث خطأ أثناء استعادة الافتراضيات:', notifiSetting_error);
        }
    },

    notifiSetting_updateSetting(notifiSetting_eventKey, notifiSetting_role, notifiSetting_isChecked) {
        try {
            if (this.notifiSetting_config[notifiSetting_eventKey]) {
                this.notifiSetting_config[notifiSetting_eventKey][notifiSetting_role] = notifiSetting_isChecked;
                this.notifiSetting_saveConfig();
            }
        } catch (notifiSetting_error) {
            console.error('حدث خطأ أثناء تحديث الإعداد:', notifiSetting_error);
        }
    },

    notifiSetting_renderTable() {
        try {
            const notifiSetting_tbody = document.getElementById('notifiSetting_settings-body');
            if (!notifiSetting_tbody) return;

            notifiSetting_tbody.innerHTML = '';

            // ترتيب المفاتيح بناءً على تعريف notifiSetting_DEFAULT_CONFIG
            const notifiSetting_keys = Object.keys(notifiSetting_DEFAULT_CONFIG);

            notifiSetting_keys.forEach(notifiSetting_key => {
                const notifiSetting_data = this.notifiSetting_config[notifiSetting_key];
                const notifiSetting_row = document.createElement('tr');

                notifiSetting_row.innerHTML = `
                    <td class="notifiSetting_event-name">${notifiSetting_data.label}</td>
                    <td>${this.notifiSetting_createCheckbox(notifiSetting_key, 'buyer', notifiSetting_data.buyer)}</td>
                    <td>${this.notifiSetting_createCheckbox(notifiSetting_key, 'admin', notifiSetting_data.admin)}</td>
                    <td>${this.notifiSetting_createCheckbox(notifiSetting_key, 'seller', notifiSetting_data.seller)}</td>
                    <td>${this.notifiSetting_createCheckbox(notifiSetting_key, 'delivery', notifiSetting_data.delivery)}</td>
                `;

                notifiSetting_tbody.appendChild(notifiSetting_row);
            });
        } catch (notifiSetting_error) {
            console.error('حدث خطأ أثناء عرض الجدول:', notifiSetting_error);
        }
    },

    notifiSetting_createCheckbox(notifiSetting_eventKey, notifiSetting_role, notifiSetting_checked) {
        try {
            // إنشاء سلسلة HTML لمربع الاختيار
            return `
                <div class="notifiSetting_checkbox-wrapper">
                    <input type="checkbox" 
                        data-event="${notifiSetting_eventKey}" 
                        data-role="${notifiSetting_role}" 
                        ${notifiSetting_checked ? 'checked' : ''} 
                        onchange="notifiSetting_Controller.notifiSetting_handleCheckboxChange(this)"
                    >
                </div>
            `;
        } catch (notifiSetting_error) {
            console.error('حدث خطأ أثناء إنشاء Checkbox:', notifiSetting_error);
            return '';
        }
    },

    notifiSetting_handleCheckboxChange(notifiSetting_input) {
        try {
            const notifiSetting_eventKey = notifiSetting_input.dataset.event;
            const notifiSetting_role = notifiSetting_input.dataset.role;
            const notifiSetting_isChecked = notifiSetting_input.checked;

            this.notifiSetting_updateSetting(notifiSetting_eventKey, notifiSetting_role, notifiSetting_isChecked);
        } catch (notifiSetting_error) {
            console.error('حدث خطأ أثناء تغيير الحالة:', notifiSetting_error);
        }
    },

    notifiSetting_setupEventListeners() {
        try {
            const notifiSetting_resetBtn = document.getElementById('notifiSetting_reset-btn');
            if (notifiSetting_resetBtn) {
                notifiSetting_resetBtn.addEventListener('click', () => {
                    this.notifiSetting_resetDefaults();
                });
            }
        } catch (notifiSetting_error) {
            console.error('حدث خطأ أثناء إعداد مستمعي الأحداث:', notifiSetting_error);
        }
    },

    notifiSetting_showToast(notifiSetting_message) {
        try {
            const notifiSetting_toast = document.getElementById('notifiSetting_toast');
            if (notifiSetting_toast) {
                notifiSetting_toast.textContent = notifiSetting_message;
                notifiSetting_toast.classList.add('notifiSetting_show');
                setTimeout(() => {
                    notifiSetting_toast.classList.remove('notifiSetting_show');
                }, 3000);
            }
        } catch (notifiSetting_error) {
            console.error('حدث خطأ أثناء عرض التنبيه:', notifiSetting_error);
        }
    }
};

// التهيئة عند جاهزية الـ DOM

try {
    notifiSetting_Controller.notifiSetting_init();
} catch (notifiSetting_error) {
    console.error('فشل بدء التطبيق:', notifiSetting_error);
}

