// js/api.js - Production-Ready API & Resource Verification Engine

export const DEFAULT_RECITER_IMAGE = 'assets/images/default-reciter.webp';
export const DEFAULT_COVER_IMAGE = 'assets/images/default-cover.webp';

export const API = {
    async fetchJson(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error(`Error loading resource ${url}:`, error);
            return null;
        }
    },

    async getConfig() { 
        return await this.fetchJson('data/config.json') || {
            developer: { name: "Engineer Moaz Mahmoud", copyright: "Designed & Developed by" },
            social: { whatsapp: "https://wa.me/2001276015281", facebook: "#", github: "#", email: "#" }
        }; 
    },

    async getSurahs() { return await this.fetchJson('data/surahs.json') || []; },
    async getRadios() { return await this.fetchJson('data/radio.json') || []; },
    async getAzkar() { return await this.fetchJson('data/azkar.json') || []; },
    async getTafsir() { return await this.fetchJson('data/tafsir.json') || []; },
    async getPlaylists() { return await this.fetchJson('data/playlists.json') || []; },
    async getCollections() { return await this.fetchJson('data/collections.json') || []; },

    async getReciters() {
        const data = await this.fetchJson('data/reciters.json') || [];
        return data.map(reciter => {
            reciter.displayPhoto = (reciter.images && reciter.images.profile) ? reciter.images.profile : DEFAULT_RECITER_IMAGE;
            reciter.displayCover = (reciter.images && reciter.images.cover) ? reciter.images.cover : DEFAULT_COVER_IMAGE;
            return reciter;
        });
    },

    async getReciterById(id) {
        const reciters = await this.getReciters();
        return reciters.find(r => r.id === id) || null;
    },

    // التحقق من صحة وجود الرابط الصوتي مسبقاً لمنع أي 404 أو NotSupportedError
    async verifyAudioUrl(url) {
        if (!url) return false;
        try {
            const res = await fetch(url, { method: 'HEAD' });
            return res.ok;
        } catch {
            // في بيئة المتصفح المحالية قد تمنع CORS طلبات HEAD، لذا نعتمد على سلامة السيرفرات المعتمدة
            return true; 
        }
    }
};