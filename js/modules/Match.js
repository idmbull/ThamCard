import { shuffle } from '../utils.js';

export default {
    data: [], selectedBlocks: [], matchedCount: 0,

    init(data) {
        this.data = data;
        this.startRound();
        document.getElementById('match-restart').onclick = () => this.startRound();
    },

    startRound() {
        this.selectedBlocks = []; this.matchedCount = 0;
        document.getElementById('match-score').textContent = "0";
        document.getElementById('match-restart').classList.add('hidden');

        // Bốc 5 từ ngẫu nhiên
        let roundItems = shuffle(this.data).slice(0, 5);

        let enBlocks = [];
        let viBlocks = [];

        roundItems.forEach(item => {
            enBlocks.push({ id: item.id, text: item.word, type: 'en' });
            let shortMeaning = item.meaning.length > 70 ? item.meaning.substring(0, 70) + "..." : item.meaning;
            viBlocks.push({ id: item.id, text: shortMeaning, type: 'vi' });
        });

        // Trộn 2 mảng này một cách độc lập
        enBlocks = shuffle(enBlocks);
        viBlocks = shuffle(viBlocks);

        const colEn = document.getElementById('match-col-en');
        const colVi = document.getElementById('match-col-vi');
        colEn.innerHTML = '';
        colVi.innerHTML = '';

        // Render cột Tiếng Anh
        enBlocks.forEach(blk => colEn.appendChild(this.createCardElement(blk)));

        // Render cột Tiếng Việt
        viBlocks.forEach(blk => colVi.appendChild(this.createCardElement(blk)));
    },

    // Hàm tạo thẻ DOM giúp code gọn gàng hơn
    createCardElement(blk) {
        const div = document.createElement('div');
        div.className = 'match-card p-4 bg-surface-container-lowest border-2 border-outline-variant/40 rounded-xl cursor-pointer flex items-center justify-center text-center font-label-lg font-bold text-on-surface hover:shadow-md transition-all min-h-[80px] select-none';
        div.textContent = blk.text;

        if (blk.type === 'vi') {
            div.classList.replace('font-label-lg', 'font-body-sm'); // Font nhỏ hơn cho tiếng Việt
            div.classList.replace('font-bold', 'font-semibold');
        }

        div.dataset.id = blk.id;
        div.dataset.type = blk.type;
        div.onclick = () => this.handleSelect(div, blk.id, blk.type);
        return div;
    },

    handleSelect(el, wordId, type) {
        if (el.classList.contains('matched') || el.classList.contains('selected')) return;

        // LOGIC MỚI: Nếu chọn 2 thẻ cùng cột (Ví dụ: đang chọn Tiếng Anh, lại bấm Tiếng Anh khác)
        // -> Hủy thẻ cũ cùng cột, nhận thẻ mới.
        const sameTypeIndex = this.selectedBlocks.findIndex(b => b.type === type);
        if (sameTypeIndex !== -1) {
            const oldBlock = this.selectedBlocks[sameTypeIndex];
            oldBlock.el.className = 'match-card p-4 bg-surface-container-lowest border-2 border-outline-variant/40 rounded-xl cursor-pointer flex items-center justify-center text-center font-bold text-on-surface hover:shadow-md transition-all min-h-[80px] select-none';
            if (oldBlock.type === 'vi') {
                oldBlock.el.classList.replace('font-bold', 'font-semibold');
                oldBlock.el.classList.replace('font-label-lg', 'font-body-sm');
            }
            this.selectedBlocks.splice(sameTypeIndex, 1); // Xóa khỏi mảng đang chọn
        }

        // Chọn thẻ hiện tại
        el.classList.add('selected', 'border-primary', 'bg-primary-fixed/30', 'text-primary');
        this.selectedBlocks.push({ el, wordId, type });

        // Khi đã chọn đủ 1 thẻ Anh và 1 thẻ Việt
        if (this.selectedBlocks.length === 2) {
            // Khóa click 2 cột
            document.getElementById('match-col-en').style.pointerEvents = 'none';
            document.getElementById('match-col-vi').style.pointerEvents = 'none';

            const [first, second] = this.selectedBlocks;

            if (first.wordId === second.wordId) {
                // ĐÚNG -> Đổi màu xanh lá và mờ đi
                setTimeout(() => {
                    const cls = 'match-card p-4 bg-secondary-fixed/50 border-2 border-secondary text-secondary rounded-xl flex items-center justify-center text-center font-bold min-h-[80px] matched opacity-40 pointer-events-none';
                    first.el.className = cls;
                    second.el.className = cls;

                    this.matchedCount++;
                    document.getElementById('match-score').textContent = this.matchedCount;
                    if (this.matchedCount === 5) document.getElementById('match-restart').classList.remove('hidden');

                    this.resetSelection();
                }, 300);
            } else {
                // SAI -> Đổi màu đỏ, rung lắc, sau đó trả về ban đầu
                first.el.classList.replace('border-primary', 'border-error');
                first.el.classList.replace('bg-primary-fixed/30', 'bg-error-container/50');
                first.el.classList.replace('text-primary', 'text-error');
                first.el.classList.add('animate-shake');

                second.el.classList.replace('border-primary', 'border-error');
                second.el.classList.replace('bg-primary-fixed/30', 'bg-error-container/50');
                second.el.classList.replace('text-primary', 'text-error');
                second.el.classList.add('animate-shake');

                setTimeout(() => {
                    const cls = 'match-card p-4 bg-surface-container-lowest border-2 border-outline-variant/40 rounded-xl cursor-pointer flex items-center justify-center text-center font-bold text-on-surface hover:shadow-md transition-all min-h-[80px] select-none';
                    first.el.className = cls; second.el.className = cls;

                    if (first.el.dataset.type === 'vi') { first.el.classList.replace('font-bold', 'font-semibold'); first.el.classList.replace('font-label-lg', 'font-body-sm'); }
                    if (second.el.dataset.type === 'vi') { second.el.classList.replace('font-bold', 'font-semibold'); second.el.classList.replace('font-label-lg', 'font-body-sm'); }

                    this.resetSelection();
                }, 600);
            }
        }
    },

    resetSelection() {
        this.selectedBlocks = [];
        // Mở khóa click 2 cột
        document.getElementById('match-col-en').style.pointerEvents = 'auto';
        document.getElementById('match-col-vi').style.pointerEvents = 'auto';
    },

    handleKeydown(e) { }
};