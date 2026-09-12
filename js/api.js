// js/api.js - Premium Dynamic Data Fetcher (100% Complete)

export const API = {
    async getSurahs() {
        try {
            const response = await fetch('data/surahs.json');
            return await response.json();
        } catch(e) { return []; }
    },

    async getReciters() {
        try {
            const response = await fetch('https://www.mp3quran.net/api/v3/reciters?language=ar');
            const data = await response.json();
            
            // صورة إسلامية موحدة وفخمة للجميع
            const unifiedIslamicPhoto = "https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&w=600&q=80";
            const egyptianNames = ["الحصري", "عبد الباسط", "المنشاوي", "البنا", "مصطفى إسماعيل", "الطبلاوي", "محمد رفعت", "أحمد نعينع", "البهتيمي", "الشعشاعي", "شعيشع"];

            const formattedReciters = data.reciters.map(r => {
                const moshaf = r.moshaf[0];
                if (!moshaf) return null;
                const isEgy = egyptianNames.some(egyName => r.name.includes(egyName));
                return {
                    id: r.id,
                    nameArabic: r.name,
                    nameEnglish: "Reciter " + r.id,
                    style: moshaf.name,
                    displayPhoto: unifiedIslamicPhoto, 
                    serverUrl: moshaf.server,
                    isEgyptianLibrary: isEgy
                };
            }).filter(r => r !== null);
            return formattedReciters;
        } catch (error) {
            console.warn("API Error", error);
            const fallbackResponse = await fetch('data/reciters.json');
            return await fallbackResponse.json();
        }
    },

    // تم إصلاح الإذاعة وحطيت السيرفرات في الكود مباشرة عشان متضربش أبداً
    async getRadios() { 
        return [
            { nameArabic: "إذاعة القرآن الكريم (القاهرة)", url: "https://stream.radioquraan.com/egypt", image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=400&q=80" },
            { nameArabic: "إذاعة عبد الباسط عبد الصمد", url: "https://qurango.net/radio/abdulbasit_abdulsamad", image: "https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&w=400&q=80" },
            { nameArabic: "إذاعة محمد صديق المنشاوي", url: "https://qurango.net/radio/mohammed_siddiq_alminshawi", image: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=400&q=80" },
            { nameArabic: "إذاعة محمود خليل الحصري", url: "https://qurango.net/radio/mahmoud_khalil_alhussary", image: "https://images.unsplash.com/photo-1564121211835-e88c852648ab?auto=format&fit=crop&w=400&q=80" }
        ];
    },

    // سحب مواقيت الصلاة بدقة لمحافظة البحر الأحمر (الغردقة)
    async getPrayerTimes() {
        try {
            const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Hurghada&country=Egypt&method=5');
            const data = await res.json();
            return data.data.timings;
        } catch(e) { return null; }
    },

    async getAzkar() { try { const res = await fetch('data/azkar.json'); return await res.json(); } catch(e) { return []; } },
    async getCollections() { try { const res = await fetch('data/collections.json'); return await res.json(); } catch(e) { return []; } },
    async getPlaylists() { try { const res = await fetch('data/playlists.json'); return await res.json(); } catch(e) { return []; } },
    async getConfig() { return { developer: { name: "Engineer Moaz Mahmoud", copyright: "تصميم وتطوير" } }; }
};