import { parseCSV } from './utils.js';

// Import Các Modules Components
import ModeFlashcard from './modules/Flashcard.js';
import ModeListening from './modules/Listening.js';
import ModeDictation from './modules/Dictation.js';
import ModeRecall from './modules/Recall.js';
import ModeRecallTyping from './modules/RecallTyping.js';
import ModeMatch from './modules/Match.js';

const App = {
    flashcards: [],
    allDataBySheet: {},
    activeModule: null,
    rootEl: null,

    settings: { autoNext: true, autoNextDelay: 1500, autoShowIpa: true, autoShowVi: true },
    progress: {},

    // HÀM KHỞI TẠO BẤT ĐỒNG BỘ ĐỂ ĐỌC DỮ LIỆU TỪ Ổ CỨNG
    async init() {
        this.rootEl = document.getElementById('app-root');
        this.loadSettings();
        this.loadProgress();
        this.bindEvents();

        try {
            // 1. Kiểm tra xem trong ổ cứng có lưu file từ vựng nào từ trước không
            const savedData = await localforage.getItem('lexicard_vocab_data');

            if (savedData && Object.keys(savedData).length > 0) {
                // 2. Nếu có, tải vào RAM
                this.allDataBySheet = savedData;

                // 3. Khôi phục lại cái Sheet cuối cùng người dùng đang học
                const lastSheet = localStorage.getItem('lexicard_last_sheet') || 'ALL';

                // Khởi động UI
                this.updateSheetSelector(lastSheet);
            } else {
                // Nếu chưa có file nào -> Hiện màn hình trống
                this.renderEmptyState();
            }
        } catch (error) {
            console.error("Lỗi khi khôi phục dữ liệu từ IndexedDB:", error);
            this.renderEmptyState();
        }
    },

    renderEmptyState() {
        if (this.rootEl) {
            this.rootEl.innerHTML = `
                <div class="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] animate-fadeIn">
                    <span class="material-symbols-outlined text-[64px] text-outline-variant mb-4">folder_open</span>
                    <h2 class="text-headline-md font-bold text-primary mb-2">Chưa có dữ liệu</h2>
                    <p class="text-on-surface-variant mb-4">Vui lòng tải lên file CSV hoặc Excel để bắt đầu.</p>
                </div>
            `;
        }
    },

    // --- QUẢN LÝ TIẾN ĐỘ ---
    loadProgress() {
        const savedProgress = localStorage.getItem('lexicard_progress');
        if (savedProgress) this.progress = JSON.parse(savedProgress);
    },

    saveProgress(modeId, index) {
        this.progress[modeId] = index;
        localStorage.setItem('lexicard_progress', JSON.stringify(this.progress));
    },

    resetProgress() {
        this.progress = {};
        localStorage.removeItem('lexicard_progress');
        localStorage.removeItem('lexicard_last_sheet');
        if (this.activeModule && this.flashcards.length > 0) {
            this.activeModule.init(this.flashcards, this.settings, 0, (idx) => this.saveProgress(this.activeModule.id, idx));
        }
    },

    // --- QUẢN LÝ CÀI ĐẶT ---
    loadSettings() {
        const saved = localStorage.getItem('lexicard_settings');
        if (saved) this.settings = { ...this.settings, ...JSON.parse(saved) };
        const saveToLocal = () => localStorage.setItem('lexicard_settings', JSON.stringify(this.settings));

        const toggleAutoNext = document.getElementById('toggle-autonext');
        const boxDelay = document.getElementById('box-autonext-delay');
        const selectDelay = document.getElementById('select-autonext-delay');

        if (toggleAutoNext && selectDelay) {
            toggleAutoNext.checked = this.settings.autoNext;
            selectDelay.value = this.settings.autoNextDelay.toString();

            const updateDelayUI = (isActive) => { boxDelay.style.opacity = isActive ? '1' : '0.5'; selectDelay.disabled = !isActive; };
            updateDelayUI(this.settings.autoNext);

            toggleAutoNext.addEventListener('change', (e) => { this.settings.autoNext = e.target.checked; updateDelayUI(e.target.checked); saveToLocal(); });
            selectDelay.addEventListener('change', (e) => { this.settings.autoNextDelay = parseInt(e.target.value); saveToLocal(); });
        }

        const toggleIpa = document.getElementById('toggle-autoshow-ipa');
        if (toggleIpa) { toggleIpa.checked = this.settings.autoShowIpa; toggleIpa.addEventListener('change', (e) => { this.settings.autoShowIpa = e.target.checked; saveToLocal(); }); }

        const toggleVi = document.getElementById('toggle-autoshow-vi');
        if (toggleVi) { toggleVi.checked = this.settings.autoShowVi; toggleVi.addEventListener('change', (e) => { this.settings.autoShowVi = e.target.checked; saveToLocal(); }); }

        // RESET TIẾN ĐỘ
        document.getElementById('btn-reset-progress')?.addEventListener('click', () => {
            if (confirm("Xóa tiến độ của file hiện tại để học lại từ đầu?")) {
                this.resetProgress();
                document.getElementById('settings-modal').classList.add('hidden');
            }
        });

        // XÓA TOÀN BỘ FILE (CLEAR DATA)
        document.getElementById('btn-clear-data')?.addEventListener('click', async () => {
            if (confirm("Bạn có chắc muốn xóa file từ vựng khỏi trình duyệt? Bạn sẽ phải tải lại file CSV/Excel để tiếp tục học.")) {
                await localforage.removeItem('lexicard_vocab_data');
                localStorage.removeItem('lexicard_last_sheet');
                this.progress = {};
                localStorage.removeItem('lexicard_progress');
                location.reload(); // F5 trình duyệt để clear RAM
            }
        });

        document.getElementById('btn-open-settings')?.addEventListener('click', () => document.getElementById('settings-modal').classList.remove('hidden'));
        document.getElementById('btn-close-settings')?.addEventListener('click', () => document.getElementById('settings-modal').classList.add('hidden'));
    },

    // --- XỬ LÝ SỰ KIỆN TẢI FILE ---
    bindEvents() {
        const fileInput = document.getElementById('csv-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Tải file mới -> Xóa tiến độ cũ
                this.progress = {};
                localStorage.removeItem('lexicard_progress');

                const extension = file.name.split('.').pop().toLowerCase();

                if (extension === 'csv') {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const parsedData = parseCSV(event.target.result);
                            this.allDataBySheet = { 'Dữ liệu CSV': parsedData };

                            // LƯU VÀO Ổ CỨNG TRÌNH DUYỆT
                            await localforage.setItem('lexicard_vocab_data', this.allDataBySheet);

                            this.updateSheetSelector('ALL');
                        } catch (err) { alert("Lỗi khi đọc file CSV! Vui lòng kiểm tra dữ liệu."); }
                    };
                    reader.readAsText(file);
                }
                else if (['xlsx', 'xls'].includes(extension)) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            if (typeof window.XLSX === 'undefined') {
                                alert("Thư viện Excel chưa được tải! Vui lòng nhấn Ctrl + F5.");
                                return;
                            }

                            const data = new Uint8Array(event.target.result);
                            const workbook = window.XLSX.read(data, { type: 'array' });
                            this.allDataBySheet = {};

                            workbook.SheetNames.forEach(sheetName => {
                                const worksheet = workbook.Sheets[sheetName];
                                const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                                const sheetCards = [];
                                for (let i = 1; i < jsonData.length; i++) {
                                    const r = jsonData[i];
                                    if (r && r.length > 0 && r[0] && r[0].toString().trim() !== "") {
                                        sheetCards.push({
                                            word: r[0] ? r[0].toString().trim() : '', phonetic: r[1] ? r[1].toString().trim() : '',
                                            pos: r[2] ? r[2].toString().trim() : '', meaning: r[3] ? r[3].toString().trim() : '',
                                            level: r[4] ? r[4].toString().trim() : '', ex_en: r[5] ? r[5].toString().trim() : '',
                                            ex_vi: r[6] ? r[6].toString().trim() : '', collocations: r[7] ? r[7].toString().trim() : ''
                                        });
                                    }
                                }
                                if (sheetCards.length > 0) this.allDataBySheet[sheetName] = sheetCards;
                            });

                            // LƯU VÀO Ổ CỨNG TRÌNH DUYỆT
                            await localforage.setItem('lexicard_vocab_data', this.allDataBySheet);

                            this.updateSheetSelector('ALL');
                        } catch (error) {
                            console.error(error);
                            alert("Lỗi đọc Excel: " + error.message);
                        }
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    alert("Định dạng file không hỗ trợ!");
                }
                e.target.value = '';
            });
        }

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.getAttribute('data-mode');

                // LƯU TIẾN ĐỘ MODULE HIỆN TẠI TRƯỚC KHI CHUYỂN TAB
                if (this.activeModule && this.activeModule.index !== undefined) {
                    this.saveProgress(this.activeModule.id, this.activeModule.index);
                } else if (this.activeModule && this.activeModule.currentIndex !== undefined) {
                    this.saveProgress(this.activeModule.id, this.activeModule.currentIndex);
                }

                this.switchMode(mode);
                document.querySelectorAll('.tab-btn').forEach(b => b.className = "tab-btn px-3 py-1.5 rounded-md font-label-md text-on-surface-variant hover:text-on-surface transition-all whitespace-nowrap");
                e.target.className = "tab-btn active px-3 py-1.5 rounded-md font-label-md text-primary bg-surface-container-lowest shadow-sm transition-all whitespace-nowrap";
            });
        });

        window.addEventListener('keydown', (e) => {
            if (this.activeModule && typeof this.activeModule.handleKeydown === 'function') {
                if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase()) && this.activeModule !== ModeDictation && this.activeModule !== ModeRecallTyping) return;
                this.activeModule.handleKeydown(e);
            }
        });
    },

    // --- CẬP NHẬT SELECTOR (THÊM THAM SỐ defaultSheet) ---
    updateSheetSelector(defaultSheet = 'ALL') {
        const selector = document.getElementById('sheet-select');
        selector.innerHTML = '';
        const sheetNames = Object.keys(this.allDataBySheet);

        if (sheetNames.length === 0) return;

        if (sheetNames.length > 1) {
            const optAll = document.createElement('option');
            optAll.value = 'ALL'; optAll.textContent = '📚 Học Tất cả';
            selector.appendChild(optAll);
        }

        sheetNames.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name; opt.textContent = `📄 ${name} (${this.allDataBySheet[name].length} từ)`;
            selector.appendChild(opt);
        });

        selector.classList.remove('hidden');

        // Khôi phục đúng cái Sheet đang học dở
        if (selector.querySelector(`option[value="${defaultSheet}"]`)) {
            selector.value = defaultSheet;
        }

        selector.onchange = (e) => {
            // Lưu lại sheet vừa chọn vào localStorage
            localStorage.setItem('lexicard_last_sheet', e.target.value);

            // Tạm reset tiến độ vì đổi dữ liệu
            this.progress = {};
            this.loadDataFromSelection(e.target.value);
        };

        this.loadDataFromSelection(selector.value);
    },

    loadDataFromSelection(selectedValue) {
        this.flashcards = [];
        if (selectedValue === 'ALL') {
            Object.values(this.allDataBySheet).forEach(sheetData => this.flashcards = this.flashcards.concat(sheetData));
        } else {
            this.flashcards = this.allDataBySheet[selectedValue] || [];
        }
        this.flashcards.forEach((card, idx) => card.id = idx + 1);

        if (this.flashcards.length >= 5) {
            document.getElementById('mode-tabs').classList.remove('hidden');

            // Tải lại thẻ Tab đang Active
            const activeTab = document.querySelector('.tab-btn.active');
            let defaultMode = 'flashcard';
            if (activeTab) defaultMode = activeTab.getAttribute('data-mode');

            if (!this.activeModule) this.switchMode(defaultMode);
            else this.switchMode(this.activeModule.id);
        }
    },

    switchMode(modeId) {
        window.speechSynthesis.cancel();
        if (window.autoNextTimer) clearTimeout(window.autoNextTimer);

        // --- ĐÃ XÓA 2 DÒNG view-section GÂY LỖI NULL Ở ĐÂY ---

        // Khôi phục UI màu sắc của Tab trên thanh Header
        document.querySelectorAll('.tab-btn').forEach(b => b.className = "tab-btn px-3 py-1.5 rounded-md font-label-md text-on-surface-variant hover:text-on-surface transition-all whitespace-nowrap");
        const targetTab = document.querySelector(`.tab-btn[data-mode="${modeId}"]`);
        if (targetTab) targetTab.className = "tab-btn active px-3 py-1.5 rounded-md font-label-md text-primary bg-surface-container-lowest shadow-sm transition-all whitespace-nowrap";

        switch (modeId) {
            case 'flashcard': this.activeModule = ModeFlashcard; break;
            case 'listening': this.activeModule = ModeListening; break;
            case 'dictation': this.activeModule = ModeDictation; break;
            case 'recall': this.activeModule = ModeRecall; break;
            case 'recall-typing': this.activeModule = ModeRecallTyping; break;
            case 'match': this.activeModule = ModeMatch; break;
            default: return;
        }

        // Bơm Giao diện HTML vào khung rỗng app-root
        this.activeModule.id = modeId;
        this.rootEl.innerHTML = this.activeModule.template();

        // Lấy tiến độ đã lưu của Module hiện tại truyền vào init()
        const savedIndex = this.progress[modeId] || 0;

        this.activeModule.init(this.flashcards, this.settings, savedIndex, (newIndex) => {
            this.saveProgress(modeId, newIndex);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());