import { speak, shuffle } from '../utils.js';

export default {
    data: [], currentItem: null, isChecked: false, index: 0, hintClicks: 0,

    init(data) {
        this.data = shuffle(data);
        this.index = 0;

        document.getElementById('rct-skip-btn').onclick = () => { this.index++; this.loadQuestion(); };

        const inputField = document.getElementById('rct-input');
        document.getElementById('rct-give-hint').onclick = () => {
            this.hintClicks++;
            const w = this.currentItem.word;
            if (this.hintClicks <= w.length) {
                inputField.value = w.slice(0, this.hintClicks);
            }
            inputField.focus();
        };

        this.loadQuestion();
    },

    loadQuestion() {
        if (this.index >= this.data.length) { alert("Hoàn thành bài tập gõ từ!"); return; }

        this.isChecked = false;
        this.hintClicks = 0;
        this.currentItem = this.data[this.index];
        const word = this.currentItem.word;

        document.getElementById('rct-current').textContent = this.index + 1;
        document.getElementById('rct-total').textContent = this.data.length;
        document.getElementById('rct-char-count').textContent = `${word.length} KÝ TỰ`;

        document.getElementById('rct-meaning').textContent = this.currentItem.meaning;

        // Ẩn / Hiện POS (Loại từ)
        const elPos = document.getElementById('rct-pos');
        if (this.currentItem.pos) {
            elPos.textContent = `(${this.currentItem.pos})`;
            elPos.classList.remove('hidden');
        } else {
            elPos.classList.add('hidden');
        }

        const inputField = document.getElementById('rct-input');
        inputField.value = '';
        inputField.disabled = false;
        inputField.classList.remove('text-secondary', 'text-error');

        document.getElementById('rct-alert').classList.add('hidden');
        document.getElementById('rct-panel-en').classList.add('hidden'); // Mặc định ẩn

        const checkBtn = document.getElementById('rct-check-btn');
        checkBtn.innerHTML = `<span>Kiểm tra</span><span class="material-symbols-outlined text-base">arrow_forward</span>`;
        checkBtn.className = 'w-full sm:w-auto px-space-xl py-space-sm rounded-lg bg-primary text-on-primary font-label-lg font-bold shadow-md hover:bg-primary-container flex items-center justify-center gap-1 transition-all';
        checkBtn.onclick = () => this.checkAnswer();

        if (window.innerWidth > 768) inputField.focus();
    },

    checkAnswer() {
        if (this.isChecked) { this.index++; this.loadQuestion(); return; }

        const inputField = document.getElementById('rct-input');
        const userAnswer = inputField.value.trim().toLowerCase();

        if (!userAnswer) return;

        this.isChecked = true;
        inputField.disabled = true;

        const alertBox = document.getElementById('rct-alert');
        const alertText = document.getElementById('rct-alert-text');
        alertBox.classList.remove('hidden');

        if (userAnswer === this.currentItem.word.toLowerCase()) {
            inputField.classList.add('text-secondary');
            alertBox.className = "w-full mt-space-sm p-space-sm rounded-lg text-center bg-secondary-container text-on-secondary-container transition-all";
            alertText.textContent = "Chính xác! Bạn nhớ từ rất tốt.";

            // Chỉ hiển thị khối Ví dụ tiếng Anh nếu có dữ liệu
            if (this.currentItem.ex_en) {
                document.getElementById('rct-val-en').innerHTML = this.currentItem.ex_en.replace(new RegExp(`(${this.currentItem.word}[a-z]*)`, 'gi'), '<strong class="text-primary not-italic">$1</strong>');
                document.getElementById('rct-panel-en').classList.remove('hidden');
            }

            const checkBtn = document.getElementById('rct-check-btn');
            checkBtn.innerHTML = `<span>Kế tiếp</span><span class="material-symbols-outlined text-base">check_circle</span>`;
            checkBtn.classList.replace('bg-primary', 'bg-secondary');
            checkBtn.classList.replace('hover:bg-primary-container', 'hover:bg-secondary');

            speak(this.currentItem.word, 1.0);
        } else {
            inputField.classList.add('text-error');
            inputField.value = this.currentItem.word;

            alertBox.className = "w-full mt-space-sm p-space-sm rounded-lg text-center bg-error-container text-on-error-container transition-all";
            alertText.textContent = "Chưa chính xác! Đáp án đúng đã hiển thị.";

            inputField.parentElement.classList.add("translate-x-1");
            setTimeout(() => inputField.parentElement.classList.remove("translate-x-1"), 100);
            setTimeout(() => inputField.parentElement.classList.add("-translate-x-1"), 200);
            setTimeout(() => inputField.parentElement.classList.remove("-translate-x-1"), 300);

            document.getElementById('rct-check-btn').innerHTML = `<span>Kế tiếp ➔</span>`;
            speak(this.currentItem.word, 1.0);
        }
    },

    handleKeydown(e) {
        if (e.key === 'Enter') { e.preventDefault(); this.checkAnswer(); }
    }
};