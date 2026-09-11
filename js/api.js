// js/api.js - Ultimate Premium Data Fetching & Smart Fallback

// صور احتياطية فخمة (Premium Islamic Fallbacks) بصيغة WebP لسرعة التحميل
export const FALLBACK_IMAGES = {
    avatar: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=300&q=80',
    cover: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80'
};

export const API = {
    async fetchJson(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            return null;
        }
    },

    async getConfig() { return await this.fetchJson('data/config.json') || null; },
    async getSurahs() { return await this.fetchJson('data/surahs.json') || []; },
    async getRadios() { return await this.fetchJson('data/radio.json') || []; },
    async getAzkar() { return await this.fetchJson('data/azkar.json') || []; },
    async getTafsir() { return await this.fetchJson('data/tafsir.json') || []; },
    async getPlaylists() { return await this.fetchJson('data/playlists.json') || []; },
    
    // جلب القراء مع المعالجة الذكية للصور
    async getReciters() {
        const data = await this.fetchJson('data/reciters.json') || [];
        return data.map(reciter => {
            // ضمان وجود صورة دائماً (Smart Fallback)
            reciter.displayPhoto = (reciter.images && reciter.images.profile) || (reciter.images && reciter.images.fallback) || FALLBACK_IMAGES.avatar;
            reciter.displayCover = (reciter.images && reciter.images.cover) || FALLBACK_IMAGES.cover;
            return reciter;
        });
    },

    async getReciterById(id) {
        const reciters = await this.getReciters();
        return reciters.find(r => r.id === id);
    },

    async getCollections() {
        return await this.fetchJson('data/collections.json') || [];
    },

    // دالة التوصيات الذكية (Smart Content Generator)
    // إذا كانت الفئة فارغة، تقوم بجلب محتوى مشابه لتجنب الشاشات الفارغة
    async getSmartRecommendations(type, limit = 6) {
        if (type === 'reciters') {
            const reciters = await this.getReciters();
            // خلط المصفوفة لجلب مقترحات عشوائية ذكية
            return reciters.sort(() => 0.5 - Math.random()).slice(0, limit);
        }
        if (type === 'surahs') {
            const surahs = await this.getSurahs();
            return surahs.sort(() => 0.5 - Math.random()).slice(0, limit);
        }
        return [];
    }
};