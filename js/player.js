// js/player.js - Premium Spotify-Inspired Audio Engine (FIXED AUDIO ROUTING)

import { StorageManager } from './storage.js';

class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.isPlaying = false;
        this.currentSurah = null;
        this.currentReciter = null;
        this.listeningTimer = 0; 
        this.lastSavedTime = 0;
        
        // استهداف عناصر الواجهة
        this.elements = {
            playBtn: document.querySelector('.btn-play-circle'),
            playIcon: document.querySelector('.btn-play-circle i'),
            progressBar: document.querySelector('.player-progress .progress-bar'),
            progressContainer: document.querySelector('.player-progress'),
            currentTimeEl: document.getElementById('current-time'),
            durationEl: document.getElementById('total-duration'),
            surahNameEl: document.getElementById('current-surah'),
            reciterNameEl: document.getElementById('current-reader'),
            volumeInput: document.getElementById('volume'),
            coverImage: document.getElementById('player-cover'),
            fallbackIcon: document.getElementById('player-fallback-icon')
        };

        this.initEventListeners();
        this.setupMediaSession();
    }

    initEventListeners() {
        if (this.elements.playBtn) {
            this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        }

        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        
        this.audio.addEventListener('loadedmetadata', () => {
            this.elements.durationEl.textContent = this.formatTime(this.audio.duration);
        });

        if (this.elements.progressContainer) {
            this.elements.progressContainer.addEventListener('click', (e) => this.seek(e));
        }

        if (this.elements.volumeInput) {
            this.elements.volumeInput.addEventListener('input', (e) => {
                this.audio.volume = e.target.value / 100;
            });
            this.audio.volume = 0.8;
        }

        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updatePlayIcon();
            this.elements.progressBar.style.width = '0%';
            StorageManager.incrementSurahsCompleted();
            StorageManager.clearContinueListening();
            // الانتقال التلقائي يمكن إضافته هنا
        });

        this.audio.addEventListener('error', () => {
            console.error("Audio playback error");
            StorageManager.showToast('عذراً، حدث خطأ في تحميل التلاوة. جاري المحاولة أو تحقق من الإنترنت.');
            this.isPlaying = false;
            this.updatePlayIcon();
        });
    }

playTrack(surah, reciter, startTime = 0) {
        this.currentSurah = surah;
        this.currentReciter = reciter;
        
        // تحديث الواجهة
        this.elements.surahNameEl.textContent = surah.nameArabic || surah.name || 'غير معروف';
        this.elements.reciterNameEl.textContent = reciter.nameArabic || reciter.name || 'غير معروف';

        // معالجة صور الغلاف
        if (reciter.displayPhoto || reciter.photo) {
            this.elements.coverImage.src = reciter.displayPhoto || reciter.photo;
            this.elements.coverImage.classList.remove('d-none');
            this.elements.fallbackIcon.classList.add('d-none');
        } else {
            this.elements.coverImage.classList.add('d-none');
            this.elements.fallbackIcon.classList.remove('d-none');
        }
        
        // =========================================
        // الحل الجذري لمشكلة بناء الرابط (Smart URL Builder)
        // =========================================
        
        // 1. البحث عن رقم السورة بأي اسم موجود في قاعدة بياناتك
        let surahNum = surah.id || surah.number || surah.number_of_surah || surah.surah_number;
        let fileName = surah.fileName || surah.audio;
        
        // 2. بناء اسم الملف الصوتي (مثال: 001.mp3)
        if (!fileName && surahNum) {
            fileName = String(surahNum).padStart(3, '0') + '.mp3';
        } else if (!fileName) {
            fileName = ''; // في حالة الإذاعة المباشرة
        }

        // 3. ضبط رابط السيرفر لضمان وجود علامة (/) في النهاية
        let baseUrl = reciter.serverUrl;
        if (baseUrl && !baseUrl.endsWith('/')) {
            baseUrl += '/';
        }

        // 4. دمج الرابط النهائي
        const audioUrl = fileName ? `${baseUrl}${fileName}` : baseUrl;
        
        // سطر للـ Debugging عشان تشوف الرابط بعينك في الـ Console
        console.log("🛠️ جاري تشغيل الرابط التالي:", audioUrl);

        this.audio.src = audioUrl;
        
        if (startTime > 0) {
            this.audio.currentTime = startTime;
        }

        this.audio.play()
            .then(() => {
                this.isPlaying = true;
                this.updatePlayIcon();
                this.updateMediaSession();
                StorageManager.addToHistory(surah, reciter);
            })
            .catch(err => {
                console.error("❌ خطأ في تشغيل الصوت:", err);
                StorageManager.showToast('عذراً، التلاوة غير متوفرة لهذا القارئ أو يوجد مشكلة بالإنترنت.');
                this.isPlaying = false;
                this.updatePlayIcon();
            });
    }
    togglePlay() {
        if (!this.audio.src) return; 

        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play();
        }
        this.isPlaying = !this.isPlaying;
        this.updatePlayIcon();
    }

    updatePlayIcon() {
        if (this.isPlaying) {
            this.elements.playIcon.className = 'fa-solid fa-pause ms-1';
        } else {
            this.elements.playIcon.className = 'fa-solid fa-play ms-1';
        }
    }

    updateProgress() {
        const { currentTime, duration } = this.audio;
        if (isNaN(duration) || !isFinite(duration)) return;

        const progressPercent = (currentTime / duration) * 100;
        this.elements.progressBar.style.width = `${progressPercent}%`;
        this.elements.currentTimeEl.textContent = this.formatTime(currentTime);

        if (Math.floor(currentTime) - this.lastSavedTime >= 5) {
            StorageManager.updateListeningTime(5); 
            StorageManager.saveContinueListening(this.currentSurah, this.currentReciter, currentTime);
            this.lastSavedTime = Math.floor(currentTime);
        }
    }

    seek(e) {
        const width = this.elements.progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = this.audio.duration;
        
        if (isNaN(duration) || !isFinite(duration)) return;

        const clickPercent = document.dir === 'rtl' ? (width - clickX) / width : clickX / width;
        this.audio.currentTime = clickPercent * duration;
    }

    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return "00:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}`;
    }

    setupMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
        }
    }

    updateMediaSession() {
        if ('mediaSession' in navigator && this.currentSurah && this.currentReciter) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: `سورة ${this.currentSurah.nameArabic}`,
                artist: this.currentReciter.nameArabic,
                album: 'نور القرآن Premium',
                artwork: [
                    { src: this.currentReciter.displayPhoto || this.currentReciter.photo || 'https://cdn-icons-png.flaticon.com/512/3382/3382152.png', sizes: '512x512', type: 'image/png' }
                ]
            });
        }
    }
}

export const globalPlayer = new AudioPlayer();