import { speak, shuffle } from '../utils.js';

export default {
    id: 'listening',
    data: [], settings: {}, currentItem: null, selectedWord: null, isChecked: false, audioSpeed: 1.0, index: 0,

    template() {
        return `
        <div class="flex flex-col w-full max-w-max-app-width mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-lg select-none animate-fadeIn">
            <div class="flex flex-wrap items-center justify-between gap-space-sm mb-space-lg">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-md font-bold uppercase tracking-wider">Dạng 1: Nghe Nhận Diện</span>
                <div class="flex items-center gap-space-sm bg-surface-container-lowest px-space-sm py-1.5 rounded-full shadow-sm">
                    <span class="font-label-md text-primary font-bold">Câu <span id="ls-current">1</span> / <span id="ls-total">0</span></span>
                </div>
            </div>
            
            <div class="w-full max-w-max-card-width mx-auto flex flex-col items-center">
                <div class="text-center mb-space-xl">
                    <h2 class="font-headline-sm text-on-surface font-bold mb-space-xxs">Nghe phát âm và chọn từ chính xác</h2>
                </div>
                
                <div class="w-full bg-surface-container-lowest rounded-xl p-space-xl shadow-md relative overflow-hidden flex flex-col items-center justify-center mb-space-xl">
                    <div class="absolute -top-12 -right-12 w-48 h-48 bg-primary-fixed/40 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="absolute -bottom-12 -left-12 w-48 h-48 bg-secondary-fixed/40 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div class="relative z-10 mb-space-lg">
                        <div class="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md font-medium" id="ls-pos-box">
                            <span class="material-symbols-outlined text-sm text-primary">lightbulb</span><span>Từ loại: <strong id="ls-pos" class="text-on-surface font-semibold">()</strong></span>
                        </div>
                    </div>
                    
                    <div class="relative z-10 flex flex-col items-center gap-space-md">
                        <button id="ls-play-btn" class="group relative flex items-center justify-center w-24 h-24 rounded-full bg-primary-container text-on-primary shadow-xl hover:scale-105 active:scale-95 transition-all">
                            <span class="absolute inset-0 rounded-full bg-primary-container/30 animate-ping pointer-events-none hidden" id="ls-ping"></span>
                            <span class="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">volume_up</span>
                        </button>
                    </div>
                    
                    <div class="relative z-10 flex items-center justify-between w-full max-w-xs mt-space-lg pt-space-md">
                        <div class="flex items-center gap-1 bg-surface-container-low p-1 rounded-full">
                            <button id="ls-speed-10" class="px-2.5 py-1 rounded-full font-label-md text-primary font-bold bg-surface-container-lowest shadow-sm transition-all">1.0x</button>
                            <button id="ls-speed-08" class="px-2.5 py-1 rounded-full font-label-md text-on-surface-variant font-bold hover:text-on-surface transition-all">0.8x</button>
                        </div>
                    </div>
                </div>
                
                <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-space-md mb-space-2xl" id="ls-grid"></div>
                
                <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-md pb-space-lg">
                    <button id="ls-skip-btn" class="w-full sm:w-auto px-space-lg py-3 rounded-lg bg-surface-container-lowest text-on-surface-variant font-label-lg font-semibold shadow-sm hover:bg-surface-container-low transition-all">Bỏ qua</button>
                    <button id="ls-check-btn" class="w-full sm:w-auto px-space-2xl py-3 rounded-lg bg-primary-container text-on-primary font-headline-sm font-bold shadow-md hover:brightness-110 transition-all hidden">Tiếp tục ➔</button>
                </div>
            </div>
        </div>
        `;
    },

    init(data, settings) {
        this.data = shuffle(data);
        this.settings = settings;
        this.index = 0;

        this.bindEvents();
        this.loadQuestion();
    },

    bindEvents() {
        document.getElementById('ls-play-btn').onclick = () => this.playAudio();
        document.getElementById('ls-skip-btn').onclick = () => { this.index++; this.loadQuestion(); };
        document.getElementById('ls-check-btn').onclick = () => { this.index++; this.loadQuestion(); };

        const s10 = document.getElementById('ls-speed-10');
        const s08 = document.getElementById('ls-speed-08');
        s10.onclick = () => { this.audioSpeed = 1.0; s10.className = 'px-2.5 py-1 rounded-full font-label-md text-primary font-bold bg-surface-container-lowest shadow-sm transition-all'; s08.className = 'px-2.5 py-1 rounded-full font-label-md text-on-surface-variant font-bold hover:text-on-surface transition-all'; this.playAudio(); };
        s08.onclick = () => { this.audioSpeed = 0.8; s08.className = 'px-2.5 py-1 rounded-full font-label-md text-primary font-bold bg-surface-container-lowest shadow-sm transition-all'; s10.className = 'px-2.5 py-1 rounded-full font-label-md text-on-surface-variant font-bold hover:text-on-surface transition-all'; this.playAudio(); };
    },

    loadQuestion() {
        if (window.autoNextTimer) clearTimeout(window.autoNextTimer);
        if (this.index >= this.data.length) { alert("Hoàn thành bài tập!"); return; }

        this.isChecked = false;
        this.selectedWord = null;
        this.currentItem = this.data[this.index];

        document.getElementById('ls-current').textContent = this.index + 1;
        document.getElementById('ls-total').textContent = this.data.length;

        const posBox = document.getElementById('ls-pos-box');
        if (this.currentItem.pos) {
            document.getElementById('ls-pos').textContent = `(${this.currentItem.pos.split(' ')[0]})`;
            posBox.style.display = 'inline-flex';
        } else {
            posBox.style.display = 'none';
        }

        document.getElementById('ls-check-btn').classList.add('hidden');

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
            // Chấm điểm luôn khi click
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

            if (word === this.currentItem.word) {
                btn.className = 'ls-opt flex items-center justify-between p-space-md rounded-xl bg-secondary-fixed/50 border border-secondary text-left';
                btn.querySelector('span:first-child').className = 'w-8 h-8 rounded-lg bg-secondary text-on-secondary font-bold flex items-center justify-center';
                btn.querySelector('.ls-icon').outerHTML = '<div class="ls-icon w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary"><span class="material-symbols-outlined text-base">check</span></div>';
            }
            else if (word === this.selectedWord && !isCorrect) {
                btn.className = 'ls-opt flex items-center justify-between p-space-md rounded-xl bg-error-container/50 border border-error text-left animate-shake';
                btn.querySelector('span:first-child').className = 'w-8 h-8 rounded-lg bg-error text-on-error font-bold flex items-center justify-center';
                btn.querySelector('.ls-icon').outerHTML = '<div class="ls-icon w-6 h-6 rounded-full bg-error flex items-center justify-center text-on-error"><span class="material-symbols-outlined text-base">close</span></div>';
            } else {
                btn.classList.add('opacity-50');
            }
        });

        const checkBtn = document.getElementById('ls-check-btn');
        checkBtn.classList.remove('hidden');

        // TỰ ĐỘNG NEXT
        if (isCorrect && this.settings && this.settings.autoNext) {
            window.autoNextTimer = setTimeout(() => { checkBtn.click(); }, this.settings.autoNextDelay);
        }
    },

    playAudio() {
        const ping = document.getElementById('ls-ping');
        if (ping) {
            ping.classList.remove('hidden');
            setTimeout(() => ping.classList.add('hidden'), 1000);
        }
        speak(this.currentItem.word, this.audioSpeed);
    },

    handleKeydown(e) {
        if (e.code === 'Space') { e.preventDefault(); this.playAudio(); }
        if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
            e.preventDefault();
            const opts = document.querySelectorAll('.ls-opt');
            if (opts[parseInt(e.key) - 1] && !this.isChecked) opts[parseInt(e.key) - 1].click();
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (this.isChecked) document.getElementById('ls-check-btn').click();
        }
    }
};