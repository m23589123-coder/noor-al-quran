// js/api.js - Premium Dynamic Data Fetcher (Fixed Images, Populated Azkar & Playlists)

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
            
            // صورة إسلامية جديدة فخمة جداً ومضمونة (مصحف مفتوح)
            const unifiedIslamicPhoto = "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=400&q=80" 
            
            const premiumGiants = [
                { id: 991, nameArabic: "عبد الباسط عبد الصمد", nameEnglish: "AbdulBaset", style: "المرتل (حفص)", displayPhoto: unifiedIslamicPhoto, serverUrl: "https://server7.mp3quran.net/basit", isEgyptianLibrary: true },
                { id: 992, nameArabic: "محمود علي البنا", nameEnglish: "Mahmoud Ali Al-Banna", style: "المرتل (حفص)", displayPhoto: unifiedIslamicPhoto, serverUrl: "https://server8.mp3quran.net/banna", isEgyptianLibrary: true },
                { id: 993, nameArabic: "محمد صديق المنشاوي", nameEnglish: "Al-Minshawi", style: "المرتل (حفص)", displayPhoto: unifiedIslamicPhoto, serverUrl: "https://server10.mp3quran.net/minsh", isEgyptianLibrary: true },
                { id: 994, nameArabic: "محمود خليل الحصري", nameEnglish: "Al-Husary", style: "المرتل (حفص)", displayPhoto: unifiedIslamicPhoto, serverUrl: "https://server13.mp3quran.net/husr", isEgyptianLibrary: true },
                { id: 995, nameArabic: "مشاري راشد العفاسي", nameEnglish: "Mishary Alafasy", style: "المرتل (حفص)", displayPhoto: unifiedIslamicPhoto, serverUrl: "https://server8.mp3quran.net/afs", isEgyptianLibrary: false }
            ];

            // محمود علي البنا: نجيب رابط السيرفر الصح من API موقع mp3quran بدل الرابط الثابت
            try {
                const bn = data.reciters.find(r => r.name.includes("البنا"));
                if (bn && bn.moshaf && bn.moshaf.length) {
                    const mo = bn.moshaf.find(m => (m.name || '').includes("مرتل")) || bn.moshaf[0];
                    const g = premiumGiants.find(r => r.id === 992);
                    if (g && mo.server) g.serverUrl = mo.server;
                }
            } catch (e) {}

            const egyptianNames = ["الطبلاوي", "محمد رفعت", "أحمد نعينع", "البهتيمي", "الشعشاعي", "شعيشع"];

            const formattedReciters = data.reciters.map(r => {
                const moshaf = r.moshaf[0];
                if (!moshaf) return null;
                if (r.name.includes("عبد الباسط") || r.name.includes("البنا") || r.name.includes("المنشاوي") || r.name.includes("الحصري") || r.name.includes("العفاسي")) return null;
                const isEgy = egyptianNames.some(egyName => r.name.includes(egyName));
                return {
                    id: r.id, nameArabic: r.name, nameEnglish: "Reciter " + r.id, style: moshaf.name,
                    displayPhoto: unifiedIslamicPhoto, serverUrl: moshaf.server, isEgyptianLibrary: isEgy
                };
            }).filter(r => r !== null);

            return [...premiumGiants, ...formattedReciters];
        } catch (error) {
            const fallbackResponse = await fetch('data/reciters.json');
            return await fallbackResponse.json();
        }
    },

    async getRadios() { 
        return [
            {
                nameArabic: "إذاعة القرآن الكريم (القاهرة)",
                url: "https://n0a.radiojar.com/8s5u5tpdtwzuv",
                // لو الرابط الأول وقع، المشغّل بيجرب اللي بعده تلقائيًا
                urls: ["https://n0a.radiojar.com/8s5u5tpdtwzuv", "https://stream.radiojar.com/8s5u5tpdtwzuv", "https://n12.radiojar.com/8s5u5tpdtwzuv"],
                image: "assets/images/icon-512.png"
            },
            { nameArabic: "إذاعة عبد الباسط عبد الصمد", url: "https://qurango.net/radio/abdulbasit_abdulsamad", image: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=400&q=80" },
            { nameArabic: "إذاعة مشاري العفاسي", url: "https://qurango.net/radio/mishary_alafasi", image: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=400&q=80" },
            // صورة إسلامية مخصصة ومختلفة لإذاعة الحصري
            { nameArabic: "إذاعة محمود خليل الحصري", url: "https://qurango.net/radio/mahmoud_khalil_alhussary", image: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=400&q=80" },
        ];
    },

    async getPrayerTimes(city = "Hurghada", country = "Egypt") {
        try {
            const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=5`);
            const data = await res.json();
            return data.data.timings;
        } catch(e) { return null; }
    },

  async getCollections() { 
        try {
            const res = await fetch('data/collections.json');
            const data = await res.json();
            if(data && data.length > 0) return data;
            throw new Error("Empty");
        } catch(e) {
            // فئات المناسبات (مليئة بسور حقيقية ومدروسة لكل مناسبة)
            return [
                { 
                    id: 'collection-jummah', 
                    title: 'مناسبة يوم الجمعة المباركة', 
                    icon: 'fa-sun', 
                    image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=600&q=80', 
                    surahs: [18, 36, 67, 112] // سورة الكهف، يس، الملك، الإخلاص
                },
                { 
                    id: 'collection-peace', 
                    title: 'سكينة الطمأنينة والهدوء النفسي', 
                    icon: 'fa-moon', 
                    image: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&w=600&q=80', 
                    surahs: [1, 55, 67, 93, 94] // الفاتحة، الرحمن، الملك، الضحى، الشرح
                },
                { 
                    id: 'collection-funerals', 
                    title: 'مواعظ مؤثرة وتلاوات الآخرة', 
                    icon: 'fa-cloud', 
                    image: 'https://images.unsplash.com/photo-1609599006353-e629aaab31ce?auto=format&fit=crop&w=600&q=80', 
                    surahs: [56, 67, 75, 78, 89] // الواقعة، الملك، القيامة، النبأ، الفجر
                }
            ];
        }
    },

    async getPlaylists() { 
        try {
            const res = await fetch('data/playlists.json');
            const data = await res.json();
            if(data && data.length > 0) return data;
            throw new Error("Empty");
        } catch(e) {
            // مختارات القوائم (بما فيها قائمة زين محمد سليم السكري وباقي المختارات المرتبة)
            return [
                { 
                    id: 'p1', 
                    title: 'زين محمد سليم السكري (المختارات الخاصة)', 
                    cover: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=600&q=80', 
                    surahs: [1, 18, 36, 55, 67, 112, 113, 114] 
                },
                { 
                    id: 'p2', 
                    title: 'الرقية الشرعية وراحة البال', 
                    cover: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=600&q=80', 
                    surahs: [1, 2, 36, 112, 113, 114] 
                },
                { 
                    id: 'p3', 
                    title: 'قصار السور والختمات العطرة', 
                    cover: 'https://images.unsplash.com/photo-1608501821300-4f99e58bba77?auto=format&fit=crop&w=600&q=80', 
                    surahs: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87] 
                }
            ];
        }
    },

    async getAzkar() { 
        try { 
            const res = await fetch('data/azkar.json'); 
            const data = await res.json(); 
            if(data && data.length > 0) return data;
            throw new Error("Empty");
        } catch(e) { 
            // بيانات جاهزة لحصن المسلم عشان ميظهرش فاضي أبداً
            return [
                { 
                    title: "أذكار الصباح", icon: "fa-sun", 
                    items: [
                        { text: "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له.", count: 1 },
                        { text: "سبحان الله وبحمده.", count: 100 },
                        { text: "اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور.", count: 1 }
                    ] 
                },
                { 
                    title: "أذكار المساء", icon: "fa-moon", 
                    items: [
                        { text: "أمسينا وأمسى الملك لله، والحمد لله.", count: 1 },
                        { text: "أستغفر الله وأتوب إليه.", count: 100 }
                    ] 
                },
                { 
                    title: "أذكار بعد الصلاة", icon: "fa-hands-praying", 
                    items: [
                        { text: "سبحان الله", count: 33 },
                        { text: "الحمد لله", count: 33 },
                        { text: "الله أكبر", count: 33 }
                    ] 
                }
            ]; 
        } 
    },
    async getConfig() { return { developer: { name: "Engineer Moaz Mahmoud", copyright: "تصميم وتطوير" } }; }
};