import { speak } from '../utils.js';

export default {
    data: [], currentIndex: 0,

    init(data) {
        this.data = data;
        this.currentIndex = 0;
        this.render();

        document.getElementById('fc-next').onclick = () => { if (this.currentIndex < this.data.length - 1) { this.currentIndex++; this.render(); } };
        document.getElementById('fc-prev').onclick = () => { if (this.currentIndex > 0) { this.currentIndex--; this.render(); } };
        document.getElementById('fc-audio').onclick = () => speak(this.data[this.currentIndex].word);
        document.getElementById('fc-audio-btn').onclick = () => speak(this.data[this.currentIndex].word);
    },

    render() {
        if (this.data.length === 0) return;
        const item = this.data[this.currentIndex];

        // 1. TỪ VỰNG (Bắt buộc)
        document.getElementById('fc-word').textContent = item.word;

        // 2. PHIÊN ÂM
        const elPhonetic = document.getElementById('fc-phonetic');
        if (item.phonetic) { elPhonetic.textContent = item.phonetic; elPhonetic.classList.remove('hidden'); }
        else { elPhonetic.classList.add('hidden'); }

        // 3. LOẠI TỪ (POS)
        const elPos = document.getElementById('fc-pos');
        if (item.pos) { elPos.textContent = item.pos; elPos.classList.remove('hidden'); }
        else { elPos.classList.add('hidden'); }

        // 4. TRÌNH ĐỘ (LEVEL)
        const elLevel = document.getElementById('fc-level');
        if (item.level) { elLevel.textContent = item.level; elLevel.classList.remove('hidden'); }
        else { elLevel.classList.add('hidden'); }

        // 5. ĐỊNH NGHĨA
        const elMeaning = document.getElementById('fc-meaning');
        if (item.meaning) {
            elMeaning.textContent = item.meaning;
            elMeaning.parentElement.style.display = 'block';
        } else {
            elMeaning.parentElement.style.display = 'none';
        }

        // 6. CÂU VÍ DỤ
        const elExEn = document.getElementById('fc-ex-en');
        const elExVi = document.getElementById('fc-ex-vi');
        if (item.ex_en) {
            elExEn.parentElement.style.display = 'block'; // Hiện khối ví dụ
            const regex = new RegExp(`(${item.word}[a-z]*)`, 'gi');
            elExEn.innerHTML = `“${item.ex_en.replace(regex, '<strong class="text-primary not-italic">$1</strong>')}”`;

            // Xử lý dịch nghĩa ví dụ
            if (item.ex_vi) { elExVi.textContent = `→ ${item.ex_vi}`; elExVi.classList.remove('hidden'); }
            else { elExVi.classList.add('hidden'); }
        } else {
            elExEn.parentElement.style.display = 'none'; // Ẩn luôn khối ví dụ nếu ko có tiếng Anh
        }

        // 7. COLLOCATIONS
        const colEl = document.getElementById('fc-collocations');
        if (item.collocations) {
            colEl.parentElement.style.display = 'flex'; // Hiện khối cụm từ
            colEl.innerHTML = '';
            item.collocations.split('|').forEach(col => {
                const parts = col.split(':');
                if (parts.length >= 2) {
                    colEl.innerHTML += `<span class="px-space-sm py-1 bg-surface-container-low text-on-surface rounded-lg font-label-md text-body-sm"><strong class="text-primary font-semibold">${parts[0].trim()}</strong> <span class="text-on-surface-variant">(${parts[1].trim()})</span></span>`;
                }
            });
        } else {
            colEl.parentElement.style.display = 'none';
        }

        document.getElementById('fc-current').textContent = this.currentIndex + 1;
        document.getElementById('fc-total').textContent = this.data.length;
    },

    handleKeydown(e) {
        if (e.key === 'ArrowLeft') document.getElementById('fc-prev').click();
        if (e.key === 'ArrowRight') document.getElementById('fc-next').click();
        if (e.code === 'Space' || e.key === 'r') { e.preventDefault(); document.getElementById('fc-audio').click(); }
    }
};