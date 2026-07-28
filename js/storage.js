// js/storage.js - Premium Local Data & Stats Manager (100% COMPLETE)

export const StorageManager = {
    // ==========================================
    // 1. نظام الإحصائيات والتتبع (Stats)
    // ==========================================
    getStats() {
        let stats = JSON.parse(localStorage.getItem('noor_stats'));
        const today = new Date().toDateString();

        if (!stats) {
            stats = { 
                totalListeningSeconds: 0, 
                surahsCompleted: 0, 
                daysActive: 1, 
                lastActiveDate: today 
            };
            localStorage.setItem('noor_stats', JSON.stringify(stats));
        } else {
            // تحديث الأيام النشطة إذا كان اليوم جديداً
            if (stats.lastActiveDate !== today) {
                stats.daysActive++;
                stats.lastActiveDate = today;
                localStorage.setItem('noor_stats', JSON.stringify(stats));
            }
        }
        return stats;
    },

    updateListeningTime(seconds) {
        let stats = this.getStats();
        stats.totalListeningSeconds += seconds;
        localStorage.setItem('noor_stats', JSON.stringify(stats));
    },

    incrementSurahsCompleted() {
        let stats = this.getStats();
        stats.surahsCompleted++;
        localStorage.setItem('noor_stats', JSON.stringify(stats));
    },

    // ==========================================
    // 2. استكمال الاستماع (Continue Listening)
    // ==========================================
    saveContinueListening(surah, reciter, time) {
        const data = { surah, reciter, time };
        localStorage.setItem('noor_continue', JSON.stringify(data));
    },

    getContinueListening() {
        return JSON.parse(localStorage.getItem('noor_continue')) || null;
    },

    clearContinueListening() {
        localStorage.removeItem('noor_continue');
    },

    // ==========================================
    // 3. سجل الاستماع (History)
    // ==========================================
    getHistory() {
        return JSON.parse(localStorage.getItem('noor_history')) || [];
    },

    addToHistory(surah, reciter) {
        let history = this.getHistory();
        const newItem = { surah, reciter, date: new Date().toISOString() };
        
        // إزالة التكرار لنفس السورة والقارئ لتحديث وقتها للأحدث
        history = history.filter(item => !(item.surah.id === surah.id && item.reciter.id === reciter.id));
        
        history.unshift(newItem); // إضافة للأول
        if (history.length > 50) history.pop(); // الاحتفاظ بآخر 50 مقطع فقط لتوفير المساحة
        
        localStorage.setItem('noor_history', JSON.stringify(history));
    },

    // ==========================================
    // 4. المفضلة (Favorites)
    // ==========================================
    getFavorites() {
        return JSON.parse(localStorage.getItem('noor_favorites')) || [];
    },

    toggleFavorite(surah) {
        let favs = this.getFavorites();
        const index = favs.findIndex(f => f.id === surah.id);
        
        if (index > -1) {
            favs.splice(index, 1);
        } else {
            favs.push(surah);
        }
        
        localStorage.setItem('noor_favorites', JSON.stringify(favs));
        return index === -1; // يُرجع true إذا تمت الإضافة
    },

    isFavorite(surahId) {
        return this.getFavorites().some(f => f.id === surahId);
    },

    // ==========================================
    // 5. قوائم التشغيل (Playlists)
    // ==========================================
    getPlaylists() {
        let lists = JSON.parse(localStorage.getItem('noor_playlists'));
        if (!lists) {
            // إنشاء قوائم افتراضية
            lists = { 
                my_playlist: { name: 'قائمتي المفضلة', items: [] },
                morning: { name: 'استماع الصباح', items: [] },
                night: { name: 'قيام الليل', items: [] }
            };
            localStorage.setItem('noor_playlists', JSON.stringify(lists));
        }
        return lists;
    },

    addToPlaylist(listId, surah, reciter) {
        let lists = this.getPlaylists();
        if (!lists[listId]) lists[listId] = { name: 'قائمة مخصصة', items: [] };
        
        const exists = lists[listId].items.some(i => i.surah.id === surah.id && i.reciter.id === reciter.id);
        
        if (!exists) {
            lists[listId].items.push({ surah, reciter });
            localStorage.setItem('noor_playlists', JSON.stringify(lists));
            this.showToast('تمت الإضافة إلى قائمة التشغيل بنجاح');
        } else {
            this.showToast('المقطع موجود بالفعل في القائمة', 'warning');
        }
    },

    // ==========================================
    // 6. نظام الإشعارات اللحظية (Toast UI)
    // ==========================================
    showToast(message, type = 'success') {
        let toastContainer = document.getElementById('noor-toast-container');
        
        // إنشاء الحاوية إذا لم تكن موجودة
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'noor-toast-container';
            toastContainer.style.cssText = `
                position: fixed; 
                bottom: 120px; 
                left: 50%; 
                transform: translateX(-50%); 
                z-index: 9999; 
                display: flex; 
                flex-direction: column; 
                gap: 10px; 
                align-items: center; 
                pointer-events: none;
            `;
            document.body.appendChild(toastContainer);
        }

        // إنشاء الإشعار
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'var(--secondary-color)' : '#ff9800';
        const textColor = type === 'success' ? 'var(--bg-color)' : '#fff';
        const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';

        toast.style.cssText = `
            background: ${bgColor}; 
            color: ${textColor}; 
            padding: 12px 25px; 
            border-radius: 50px; 
            font-family: var(--font-cairo); 
            font-weight: bold; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.3); 
            opacity: 0; 
            transform: translateY(20px); 
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        toast.innerHTML = `<i class="fa-solid ${icon} fs-5"></i> <span>${message}</span>`;
        
        toastContainer.appendChild(toast);
        
        // حركة الظهور
        setTimeout(() => { 
            toast.style.opacity = '1'; 
            toast.style.transform = 'translateY(0)'; 
        }, 10);
        
        // حركة الاختفاء والإزالة
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
};