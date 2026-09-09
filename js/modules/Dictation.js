import { speak, shuffle } from '../utils.js';

export default {
    data: [], currentItem: null, isChecked: false, audioSpeed: 1.0, index: 0, hintClicks: 0,

    init(data) {
        this.data = shuffle(data);
        this.index = 0;

        document.getElementById('dict-play-btn').onclick = () => this.playAudio();
        document.getElementById('dict-skip-btn').onclick = () => { this.index++; this.loadQuestion(); };

        const s10 = document.getElementById('dict-speed-10');
        const s08 = document.getElementById('dict-speed-08');
        s10.onclick = () => { this.audioSpeed = 1.0; s10.className = 'px-space-sm py-1 rounded-full font-label-md bg-surface-container-lowest text-primary font-bold shadow-sm flex items-center gap-1'; s08.className = 'px-space-sm py-1 rounded-full font-label-md text-on-surface-variant hover:text-on-surface flex items-center gap-1'; this.playAudio(); };
        s08.onclick = () => { this.audioSpeed = 0.75; s08.className = 'px-space-sm py-1 rounded-full font-label-md bg-surface-container-lowest text-primary font-bold shadow-sm flex items-center gap-1'; s10.className = 'px-space-sm py-1 rounded-full font-label-md text-on-surface-variant hover:text-on-surface flex items-center gap-1'; this.playAudio(); };

        document.getElementById('dict-hint-ipa').onclick = () => document.getElementById('dict-panel-ipa').classList.toggle('hidden');
        document.getElementById('dict-hint-vi').onclick = () => document.getElementById('dict-panel-vi').classList.toggle('hidden');

        const inputField = document.getElementById('dict-input');
        document.getElementById('dict-give-hint').onclick = () => {
            this.hintClicks++;
            const w = this.currentItem.word;
            if (this.hintClicks <= w.length) { inputField.value = w.slice(0, this.hintClicks); }
            inputField.focus();
        };

        this.loadQuestion();
    },

    loadQuestion() {
        if (this.index >= this.data.length) { alert("Hoàn thành bài tập!"); return; }

        this.isChecked = false; this.hintClicks = 0;
        this.currentItem = this.data[this.index];
        const word = this.currentItem.word;

        document.getElementById('dict-current').textContent = this.index + 1;
        document.getElementById('dict-total').textContent = this.data.length;
        document.getElementById('dict-char-count').textContent = `${word.length} KÝ TỰ`;

        // Gen Letter Slots
        const slotCont = document.getElementById('dict-slots');
        slotCont.innerHTML = '';
        const wUpper = word.toUpperCase();
        slotCont.innerHTML += `<div class="w-8 h-10 rounded-lg bg-surface-container flex items-center justify-center font-headline-sm font-bold text-primary shadow-inner">${wUpper[0]}</div>`;
        for (let i = 1; i < word.length - 1; i++) {
            slotCont.innerHTML += `<div class="w-8 h-10 rounded-lg bg-surface-container-low flex items-center justify-center font-headline-sm font-semibold text-on-surface-variant/40">_</div>`;
        }
        if (word.length > 1) {
            slotCont.innerHTML += `<div class="w-8 h-10 rounded-lg bg-surface-container flex items-center justify-center font-headline-sm font-bold text-primary shadow-inner">${wUpper[word.length - 1]}</div>`;
        }

        // TỐI ƯU CÁC TRƯỜNG OPTIONAL

        // 1. Câu ví dụ (Context)
        const elContext = document.getElementById('dict-context');
        if (this.currentItem.ex_en) {
            elContext.parentElement.style.display = 'block';
            const regex = new RegExp(`(${word}[a-z]*)`, 'gi');
            elContext.innerHTML = `"${this.currentItem.ex_en.replace(regex, '<span class="font-bold text-primary underline decoration-dotted">___________</span>')}"`;
        } else {
            elContext.parentElement.style.display = 'none'; // Ẩn luôn khối Context
        }

        // 2. Gợi ý IPA
        const btnIpa = document.getElementById('dict-hint-ipa');
        if (this.currentItem.phonetic) {
            btnIpa.classList.remove('hidden');
            document.getElementById('dict-val-ipa').textContent = this.currentItem.phonetic;
        } else {
            btnIpa.classList.add('hidden'); // Ẩn nút IPA
        }

        // 3. Gợi ý Nghĩa
        const btnVi = document.getElementById('dict-hint-vi');
        if (this.currentItem.meaning) {
            btnVi.classList.remove('hidden');
            let posHTML = this.currentItem.pos ? `<span class="font-bold text-secondary">${this.currentItem.pos.split(' ')[0]}</span>. ` : '';
            document.getElementById('dict-val-vi').innerHTML = `${posHTML}${this.currentItem.meaning}`;
        } else {
            btnVi.classList.add('hidden'); // Ẩn nút gợi ý nghĩa
        }

        document.getElementById('dict-panel-ipa').classList.add('hidden');
        document.getElementById('dict-panel-vi').classList.add('hidden');

        // Khôi phục Input
        const inputField = document.getElementById('dict-input');
        inputField.value = ''; inputField.disabled = false;
        inputField.classList.remove('text-secondary', 'text-error');
        document.getElementById('dict-alert').classList.add('hidden');

        const checkBtn = document.getElementById('dict-check-btn');
        checkBtn.innerHTML = `<span>Kiểm tra</span><span class="material-symbols-outlined text-base">arrow_forward</span>`;
        checkBtn.className = 'w-full sm:w-auto px-space-xl py-space-sm rounded-lg bg-primary text-on-primary font-label-lg font-bold shadow-md hover:bg-primary-container flex items-center justify-center gap-1 transition-all';
        checkBtn.onclick = () => this.checkAnswer();

        if (window.innerWidth > 768) inputField.focus();
        setTimeout(() => this.playAudio(), 500);
    },

    checkAnswer() {
        if (this.isChecked) { this.index++; this.loadQuestion(); return; }

        const inputField = document.getElementById('dict-input');
        const userAnswer = inputField.value.trim().toLowerCase();
        if (!userAnswer) return;

        this.isChecked = true; inputField.disabled = true;
        const alertBox = document.getElementById('dict-alert');
        const alertText = document.getElementById('dict-alert-text');
        alertBox.classList.remove('hidden');

        if (userAnswer === this.currentItem.word.toLowerCase()) {
            inputField.classList.add('text-secondary');
            alertBox.className = "w-full mt-space-sm p-space-sm rounded-lg text-center bg-secondary-container text-on-secondary-container transition-all";
            alertText.textContent = "Tuyệt vời! Bạn đã gõ đúng.";

            const checkBtn = document.getElementById('dict-check-btn');
            checkBtn.innerHTML = `<span>Kế tiếp</span><span class="material-symbols-outlined text-base">check_circle</span>`;
            checkBtn.classList.replace('bg-primary', 'bg-secondary');
            checkBtn.classList.replace('hover:bg-primary-container', 'hover:bg-secondary');
        } else {
            inputField.classList.add('text-error');
            inputField.value = this.currentItem.word;
            alertBox.className = "w-full mt-space-sm p-space-sm rounded-lg text-center bg-error-container text-on-error-container transition-all";
            alertText.textContent = "Chưa chính xác! Đáp án đúng đã hiển thị.";

            inputField.parentElement.classList.add("translate-x-1");
            setTimeout(() => inputField.parentElement.classList.remove("translate-x-1"), 100);
            setTimeout(() => inputField.parentElement.classList.add("-translate-x-1"), 200);
            setTimeout(() => inputField.parentElement.classList.remove("-translate-x-1"), 300);

            document.getElementById('dict-check-btn').innerHTML = `<span>Kế tiếp ➔</span>`;
        }
    },

    playAudio() {
        const p = document.getElementById('dict-pulse');
        p.classList.remove('hidden'); p.classList.add('animate-ping');
        speak(this.currentItem.word, this.audioSpeed);
        setTimeout(() => { p.classList.add('hidden'); p.classList.remove('animate-ping'); }, 1200);
    },

    handleKeydown(e) {
        const inputField = document.getElementById('dict-input');
        if (e.key === 'Enter') { e.preventDefault(); this.checkAnswer(); }
        if (e.code === 'Space' && document.activeElement !== inputField) {
            e.preventDefault(); this.playAudio();
        }
    }
};