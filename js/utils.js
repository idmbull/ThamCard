export const parseCSV = (strData) => {
    const arrData = [];
    const objPattern = new RegExp(("(\\,|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\"\\,\\r\\n]*))"), "gi");
    let arrMatches = null; let currentRow = [];

    while (arrMatches = objPattern.exec(strData)) {
        if (arrMatches[1].length && arrMatches[1] !== ",") {
            if (currentRow.length > 0) arrData.push(currentRow);
            currentRow = [];
        }
        currentRow.push(arrMatches[2] ? arrMatches[2].replace(/""/g, "\"") : arrMatches[3]);
    }
    if (currentRow.length > 0) arrData.push(currentRow);

    const flashcards = [];
    for (let i = 1; i < arrData.length; i++) { // Bỏ qua dòng Header
        const r = arrData[i];

        // CHỈ CẦN CỘT 0 (TỪ VỰNG) CÓ CHỮ LÀ SẼ LẤY, CÁC CỘT KHÁC TRỐNG CŨNG KHÔNG SAO
        if (r && r.length > 0 && r[0] && r[0].trim() !== "") {
            flashcards.push({
                id: i,
                word: r[0] ? r[0].trim() : '',
                phonetic: r[1] ? r[1].trim() : '',
                pos: r[2] ? r[2].trim() : '',
                meaning: r[3] ? r[3].trim() : '',
                level: r[4] ? r[4].trim() : '',
                ex_en: r[5] ? r[5].trim() : '',
                ex_vi: r[6] ? r[6].trim() : '',
                collocations: r[7] ? r[7].trim() : ''
            });
        }
    }
    return flashcards;
};

export const speak = (word, rate = 1.0) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(word);
        utter.lang = 'en-US';
        utter.rate = rate;
        window.speechSynthesis.speak(utter);
    }
};

export const shuffle = (array) => {
    return array.slice().sort(() => Math.random() - 0.5);
};