import { speak, shuffle } from '../utils.js';

export default {
    data: [], currentItem: null, selectedWord: null, isChecked: false, audioSpeed: 1.0, index: 0,

    init(data) {
        this.data = shuffle(data);
        this.index = 0;

        document.getElementById('ls-play-btn').onclick = () => this.playAudio();
        document.getElementById('ls-skip-btn').onclick = () => { this.index++; this.loadQuestion(); };

        const s10 = document.getElementById('ls-speed-10');
        const s08 = document.getElementById('ls-speed-08');
        s10.onclick = () => { this.audioSpeed = 1.0; s10.className = 'px-2.5 py-1 rounded-full font-label-md text-primary font-bold bg-surface-container-lowest shadow-sm'; s08.className = 'px-2.5 py-1 rounded-full font-label-md text-on-surface-variant font-bold hover:text-on-surface'; this.playAudio(); };
        s08.onclick = () => { this.audioSpeed = 0.8; s08.className = 'px-2.5 py-1 rounded-full font-label-md text-primary font-bold bg-surface-container-lowest shadow-sm'; s10.className = 'px-2.5 py-1 rounded-full font-label-md text-on-surface-variant font-bold hover:text-on-surface'; this.playAudio(); };

        this.loadQuestion();
    },

    loadQuestion() {
        if (this.index >= this.data.length) { alert("Hoàn thành bài tập!"); return; }

        this.isChecked = false;
        this.selectedWord = null;
        this.currentItem = this.data[this.index];

        document.getElementById('ls-current').textContent = this.index + 1;
        document.getElementById('ls-total').textContent = this.data.length;

        const lsPos = document.getElementById('ls-pos');
        if (this.currentItem.pos) {
            lsPos.textContent = `(${this.currentItem.pos.split(' ')[0]})`;
            lsPos.parentElement.style.display = 'inline-flex';
        } else {
            lsPos.parentElement.style.display = 'none';
        }

        // Ẩn nút Kiểm tra lúc mới load câu hỏi
        const checkBtn = document.getElementById('ls-check-btn');
        checkBtn.classList.add('hidden');
        checkBtn.onclick = () => { this.index++; this.loadQuestion(); }; // Gán sẵn sự kiện Next cho nút

        let pool = this.data.filter(f => f.word !== this.currentItem.word);
        let options = shuffle(pool).slice(0, 5);
        options.push(this.currentItem);
        options = shuffle(options);

        const grid = document.getElementById('ls-grid');
        grid.innerHTML = '';

        options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'ls-opt group relative flex items-center justify-between p-space-md rounded-xl bg-surface-container-lowest shadow-sm hover:bg-surface-container-low text-left border border-transparent transition-all';
            btn.innerHTML = `
                <div class="flex items-center gap-space-sm pointer-events-none">
                    <span class="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant font-bold flex items-center justify-center group-hover:bg-primary-fixed group-hover:text-on-primary-fixed">${i + 1}</span>
                    <span class="font-headline-sm font-bold truncate">${opt.word}</span>
                </div>
                <span class="ls-icon material-symbols-outlined text-outline-variant opacity-0 group-hover:opacity-100 pointer-events-none">radio_button_unchecked</span>
            `;
            // Khi click thì chạy thẳng hàm checkAnswer
            btn.onclick = () => {
                if (!this.isChecked) {
                    this.selectedWord = opt.word;
                    this.checkAnswer();
                }
            };
            grid.appendChild(btn);
        });

        setTimeout(() => this.playAudio(), 500);
    },

    checkAnswer() {
        this.isChecked = true;
        const isCorrect = (this.selectedWord === this.currentItem.word);

        document.querySelectorAll('.ls-opt').forEach(btn => {
            const word = btn.querySelector('span.font-headline-sm').textContent;
            btn.classList.add('pointer-events-none');

            // Bôi xanh đáp án đúng
            if (word === this.currentItem.word) {
                btn.className = 'ls-opt flex items-center justify-between p-space-md rounded-xl bg-secondary-fixed/50 border border-secondary text-left';
                btn.querySelector('span:first-child').className = 'w-8 h-8 rounded-lg bg-secondary text-on-secondary font-bold flex items-center justify-center';
                btn.querySelector('.ls-icon').outerHTML = '<div class="ls-icon w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary"><span class="material-symbols-outlined text-base">check</span></div>';
            }
            // Bôi đỏ đáp án sai (nếu user click nhầm)
            else if (word === this.selectedWord && !isCorrect) {
                btn.className = 'ls-opt flex items-center justify-between p-space-md rounded-xl bg-error-container/50 border border-error text-left animate-shake';
                btn.querySelector('span:first-child').className = 'w-8 h-8 rounded-lg bg-error text-on-error font-bold flex items-center justify-center';
                btn.querySelector('.ls-icon').outerHTML = '<div class="ls-icon w-6 h-6 rounded-full bg-error flex items-center justify-center text-on-error"><span class="material-symbols-outlined text-base">close</span></div>';
            } else {
                btn.classList.add('opacity-50');
            }
        });

        // Hiện nút Tiếp tục
        const checkBtn = document.getElementById('ls-check-btn');
        checkBtn.innerHTML = `<span>Tiếp tục</span><span class="material-symbols-outlined text-base">arrow_forward</span>`;
        checkBtn.classList.remove('hidden');
        checkBtn.disabled = false;
    },

    playAudio() {
        const ping = document.getElementById('ls-ping');
        ping.classList.remove('hidden');
        setTimeout(() => ping.classList.add('hidden'), 1000);
        speak(this.currentItem.word, this.audioSpeed);
    },

    handleKeydown(e) {
        if (e.code === 'Space') { e.preventDefault(); this.playAudio(); }
        // Bấm phím 1->6 để chọn và kiểm tra luôn
        if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
            e.preventDefault();
            const opts = document.querySelectorAll('.ls-opt');
            if (opts[parseInt(e.key) - 1]) opts[parseInt(e.key) - 1].click();
        }
        // Bấm Enter để Next qua câu sau (Nếu đã kiểm tra xong)
        if (e.key === 'Enter') {
            e.preventDefault();
            if (this.isChecked) {
                document.getElementById('ls-check-btn').click();
            }
        }
    }
};