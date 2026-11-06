// js/theme.js - Premium User Preferences & Settings Manager

export const SettingsManager = {
    defaultSettings: {
        theme: 'dark',
        autoPlayNext: true
    },

    init() {
        this.applyTheme(this.getSetting('theme'));
    },

    getSetting(key) {
        const settings = JSON.parse(localStorage.getItem('noor_settings')) || this.defaultSettings;
        return settings[key] !== undefined ? settings[key] : this.defaultSettings[key];
    },

    saveSetting(key, value) {
        let settings = JSON.parse(localStorage.getItem('noor_settings')) || this.defaultSettings;
        settings[key] = value;
        localStorage.setItem('noor_settings', JSON.stringify(settings));

        if (key === 'theme') {
            this.applyTheme(value);
        }
    },

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // تغيير لون الميتا تاج الخاص بالمتصفح في الهواتف
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#071A13' : '#F8F9FA');
        }
    },

    async clearCache() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const name of cacheNames) {
                await caches.delete(name);
            }
            // مسح الـ LocalStorage الأساسية لتنظيف شامل باستثناء المحفوظات والمفضلة
            localStorage.removeItem('noor_settings');
            
            alert("تم مسح بيانات النظام المؤقتة بنجاح!");
            window.location.reload();
        }
    }
};