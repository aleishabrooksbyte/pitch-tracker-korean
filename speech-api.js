// --- OCR Screenshot Handling ---
const screenshotInput = document.getElementById('screenshot-input');
const uploadScreenshotBtn = document.getElementById('upload-screenshot-btn');
const ocrStatusEl = document.getElementById('ocr-status');

uploadScreenshotBtn.addEventListener('click', () => {
    screenshotInput.click();
});

screenshotInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    ocrStatusEl.innerText = "Scanning screenshot for text... 🔍";
    ocrStatusEl.style.color = "#007aff";

    // Use Tesseract.js to recognize Korean and English text simultaneously
    Tesseract.recognize(
        file,
        'kor+eng',
        { 
            logger: m => {
                if (m.status === 'recognizing text') {
                    ocrStatusEl.innerText = `Reading image: ${Math.round(m.progress * 100)}%`;
                }
            }
        }
    ).then(({ data: { text } }) => {
        ocrStatusEl.innerText = "";
        parseExtractedText(text);
        screenshotInput.value = ""; // Reset file input
    }).catch(err => {
        console.error(err);
        ocrStatusEl.innerText = "Could not read image. Try a clearer screenshot.";
        ocrStatusEl.style.color = "#ff3b30";
    });
});

// Helper to intelligently split Korean and English from the raw OCR output
function parseExtractedText(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let koreanFound = "";
    let englishFound = "";

    for (let line of lines) {
        // Check if line contains Korean characters (Hangul)
        if (/[가-힣]/.test(line)) {
            if (!koreanFound) koreanFound = line;
        } else {
            // Assume non-Korean lines are English meanings
            if (!englishFound && line.length > 2) englishFound = line;
        }
    }

    if (koreanFound) {
        newKoreanInput.value = koreanFound;
        if (englishFound) newEnglishInput.value = englishFound;
        
        feedbackEl.innerText = "Text extracted successfully! Tap Add.";
        feedbackEl.style.color = "#34c759";
    } else {
        // Fallback: Just drop the raw text into the Korean box if parsing fails
        newKoreanInput.value = rawText.trim();
        feedbackEl.innerText = "Check extracted text and tap Add.";
        feedbackEl.style.color = "#ff9500";
    }
}