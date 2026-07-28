// js/tasbeeh.js - Premium Electronic Tasbeeh Logic

document.addEventListener('DOMContentLoaded', () => {
    const clickBtn = document.getElementById('tasbeeh-click-btn');
    const resetBtn = document.getElementById('tasbeeh-reset-btn');
    const countEl = document.getElementById('tasbeeh-count');
    const textEl = document.getElementById('tasbeeh-text');

    if (!clickBtn || !resetBtn || !countEl || !textEl) return;

    // استرجاع العدد المحفوظ سابقاً
    let count = parseInt(localStorage.getItem('noor_tasbeeh_count')) || 0;
    updateUI();

    // حدث الضغط على التسبيح
    clickBtn.addEventListener('click', () => {
        count++;
        localStorage.setItem('noor_tasbeeh_count', count);
        
        // اهتزاز خفيف للهواتف المدعومة
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }

        // تأثير حركي خفيف للرقم
        countEl.style.transform = 'scale(1.3)';
        setTimeout(() => countEl.style.transform = 'scale(1)', 150);

        updateUI();
    });

    // حدث تصفير العداد
    resetBtn.addEventListener('click', () => {
        count = 0;
        localStorage.setItem('noor_tasbeeh_count', count);
        
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]); // اهتزاز مميز للتصفير
        }

        updateUI();
    });

    // تحديث الواجهة وتغيير نص الذكر تلقائياً
    function updateUI() {
        countEl.textContent = count;

        // تغيير الذكر كل 33 تسبيحة
        const cycle = count % 99;
        
        if (count === 0) {
            textEl.textContent = "سُبْحَانَ اللَّهِ";
        } else if (cycle > 0 && cycle <= 33) {
            textEl.textContent = "سُبْحَانَ اللَّهِ";
            textEl.style.color = "var(--secondary-color)";
        } else if (cycle > 33 && cycle <= 66) {
            textEl.textContent = "الْحَمْدُ لِلَّهِ";
            textEl.style.color = "#4CAF50"; // أخضر خفيف
        } else if (cycle > 66 || cycle === 0) {
            textEl.textContent = "اللَّهُ أَكْبَرُ";
            textEl.style.color = "#FF9800"; // برتقالي خفيف
        }
    }
});