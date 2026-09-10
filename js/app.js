import { parseCSV } from './utils.js';

// Import các Module Components
import ModeFlashcard from './modules/Flashcard.js';
import ModeListening from './modules/Listening.js';
import ModeDictation from './modules/Dictation.js';
import ModeRecall from './modules/Recall.js';
import ModeRecallTyping from './modules/RecallTyping.js';
import ModeMatch from './modules/Match.js';

// ... (các dòng import giữ nguyên)

const App = {
    flashcards: [],
    allDataBySheet: {},
    activeModule: null,
    rootEl: null,

    // ĐỊNH NGHĨA SETTINGS CƠ BẢN
    settings: {
        autoNext: true,
        autoNextDelay: 1500, // Chọn 1500 làm chuẩn
        autoShowIpa: true,   // Bật
        autoShowVi: true     // Bật
    },

    init() {
        this.rootEl = document.getElementById('app-root');
        this.loadSettings();
        this.bindEvents();
        this.renderEmptyState();
    },

    loadSettings() {
        // Đọc từ LocalStorage
        const saved = localStorage.getItem('lexicard_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }

        // --- LIÊN KẾT GIAO DIỆN ---
        const saveToLocal = () => localStorage.setItem('lexicard_settings', JSON.stringify(this.settings));

        // 1. Nút Auto Next
        const toggleAutoNext = document.getElementById('toggle-autonext');
        const boxDelay = document.getElementById('box-autonext-delay');
        const selectDelay = document.getElementById('select-autonext-delay');

        if (toggleAutoNext && selectDelay) {
            toggleAutoNext.checked = this.settings.autoNext;
            selectDelay.value = this.settings.autoNextDelay.toString();

            // Làm mờ ô chọn thời gian nếu tắt Auto-next
            const updateDelayUI = (isActive) => {
                boxDelay.style.opacity = isActive ? '1' : '0.5';
                selectDelay.disabled = !isActive;
            };
            updateDelayUI(this.settings.autoNext);

            // Bắt sự kiện Gạt Auto Next
            toggleAutoNext.addEventListener('change', (e) => {
                this.settings.autoNext = e.target.checked;
                updateDelayUI(e.target.checked);
                saveToLocal();
            });

            // Bắt sự kiện Đổi thời gian
            selectDelay.addEventListener('change', (e) => {
                this.settings.autoNextDelay = parseInt(e.target.value);
                saveToLocal();
            });
        }

        // 2. Nút Hiện IPA
        const toggleIpa = document.getElementById('toggle-autoshow-ipa');
        if (toggleIpa) {
            toggleIpa.checked = this.settings.autoShowIpa;
            toggleIpa.addEventListener('change', (e) => {
                this.settings.autoShowIpa = e.target.checked;
                saveToLocal();
            });
        }

        // 3. Nút Hiện Tiếng Việt
        const toggleVi = document.getElementById('toggle-autoshow-vi');
        if (toggleVi) {
            toggleVi.checked = this.settings.autoShowVi;
            toggleVi.addEventListener('change', (e) => {
                this.settings.autoShowVi = e.target.checked;
                saveToLocal();
            });
        }

        // Đóng/Mở Modal
        document.getElementById('btn-open-settings')?.addEventListener('click', () => document.getElementById('settings-modal').classList.remove('hidden'));
        document.getElementById('btn-close-settings')?.addEventListener('click', () => document.getElementById('settings-modal').classList.add('hidden'));
    },

    bindEvents() {
        const fileInput = document.getElementById('csv-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const extension = file.name.split('.').pop().toLowerCase();

                if (extension === 'csv') {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const parsedData = parseCSV(event.target.result);
                            this.allDataBySheet = { 'Dữ liệu CSV': parsedData };
                            this.updateSheetSelector();
                        } catch (err) {
                            console.error("Lỗi đọc CSV:", err);
                            alert("Lỗi khi đọc file CSV! Vui lòng kiểm tra lại dữ liệu.");
                        }
                    };
                    reader.readAsText(file);
                }
                else if (['xlsx', 'xls'].includes(extension)) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const data = new Uint8Array(event.target.result);

                            // Sử dụng window.XLSX thay vì import
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
                                            word: r[0] ? r[0].toString().trim() : '',
                                            phonetic: r[1] ? r[1].toString().trim() : '',
                                            pos: r[2] ? r[2].toString().trim() : '',
                                            meaning: r[3] ? r[3].toString().trim() : '',
                                            level: r[4] ? r[4].toString().trim() : '',
                                            ex_en: r[5] ? r[5].toString().trim() : '',
                                            ex_vi: r[6] ? r[6].toString().trim() : '',
                                            collocations: r[7] ? r[7].toString().trim() : ''
                                        });
                                    }
                                }
                                if (sheetCards.length > 0) this.allDataBySheet[sheetName] = sheetCards;
                            });
                            this.updateSheetSelector();
                        } catch (error) {
                            console.error("Lỗi đọc Excel:", error);
                            alert("Lỗi không thể đọc cấu trúc file Excel!");
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

    updateSheetSelector() {
        const selector = document.getElementById('sheet-select');
        selector.innerHTML = '';
        const sheetNames = Object.keys(this.allDataBySheet);

        if (sheetNames.length === 0) {
            alert("File không có dữ liệu từ vựng hợp lệ (Cột đầu tiên bị trống).");
            return;
        }

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
        selector.onchange = (e) => this.loadDataFromSelection(e.target.value);
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
            if (!this.activeModule) this.switchMode('flashcard');
            else this.switchMode(this.activeModule.id);
        } else {
            alert("Sheet này cần ít nhất 5 từ vựng để tạo bài luyện tập trắc nghiệm!");
        }
    },

    switchMode(modeId) {
        window.speechSynthesis.cancel();
        if (window.autoNextTimer) clearTimeout(window.autoNextTimer);

        switch (modeId) {
            case 'flashcard': this.activeModule = ModeFlashcard; break;
            case 'listening': this.activeModule = ModeListening; break;
            case 'dictation': this.activeModule = ModeDictation; break;
            case 'recall': this.activeModule = ModeRecall; break;
            case 'recall-typing': this.activeModule = ModeRecallTyping; break;
            case 'match': this.activeModule = ModeMatch; break;
            default: return;
        }

        this.activeModule.id = modeId;
        this.rootEl.innerHTML = this.activeModule.template();
        this.activeModule.init(this.flashcards, this.settings);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());