// Default baseline vocabulary deck
const defaultVocabulary = [
    { korean: "안녕하세요", english: "(Hello)" },
    { korean: "감사합니다", english: "(Thank you)" },
    { korean: "사랑해요", english: "(I love you)" },
    { korean: "반갑습니다", english: "(Nice to meet you)" },
    { korean: "잘 지내세요?", english: "(How have you been?)" }
];

// Load vocabulary from localStorage or initialize with defaults
let vocabularyDeck = loadVocabulary();

function loadVocabulary() {
    const saved = localStorage.getItem('korean_custom_deck');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (e) {
            console.error("Error loading saved deck, falling back to defaults", e);
        }
    }
    return [...defaultVocabulary];
}

function saveVocabulary() {
    localStorage.setItem('korean_custom_deck', JSON.stringify(vocabularyDeck));
    updateDeckCounter();
}

function updateDeckCounter() {
    const counter = document.getElementById('deck-counter');
    if (counter) {
        counter.innerText = `Practice Deck: ${vocabularyDeck.length} phrases loaded`;
    }
}

// State variables
let currentIndex = -1;
let lastIndex = -1;

const targetWordEl = document.getElementById('target-word');
const englishMeaningEl = document.getElementById('english-meaning');
const listenButton = document.getElementById('listen-button');
const recordingButton = document.getElementById('recording-button');
const nextButton = document.getElementById('next-button');
const skipButton = document.getElementById('skip-button');
const transcriptionResult = document.getElementById('transcription-result');
const feedbackEl = document.getElementById('feedback');
const coachMessageEl = document.getElementById('coach-message');

const newKoreanInput = document.getElementById('new-korean');
const newEnglishInput = document.getElementById('new-english');
const addButton = document.getElementById('add-button');
const exportButton = document.getElementById('export-button');

const screenshotInput = document.getElementById('screenshot-input');
const ocrStatusEl = document.getElementById('ocr-status');

// Helper function to clean and fix Korean spacing/particle issues from OCR
function cleanKoreanText(text) {
    return text
        .replace(/[^가-힣a-zA-Z0-9\s.,?!~]/g, '')
        .replace(/\s+([요을를은는이가에도서로으로과와박밖에]+)(\s|$)/g, '$1$2')
        .replace(/\s+([요]+)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
}

// Pick a random phrase ensuring no back-to-back repeats
function getRandomPhrase() {
    if (!vocabularyDeck || vocabularyDeck.length === 0) return;
    
    if (vocabularyDeck.length === 1) {
        currentIndex = 0;
    } else {
        do {
            currentIndex = Math.floor(Math.random() * vocabularyDeck.length);
        } while (currentIndex === lastIndex);
    }
    lastIndex = currentIndex;
    
    const currentItem = vocabularyDeck[currentIndex];
    if (targetWordEl) targetWordEl.innerText = currentItem.korean;
    if (englishMeaningEl) englishMeaningEl.innerText = currentItem.english;
    if (transcriptionResult) transcriptionResult.innerText = "";
    if (feedbackEl) feedbackEl.innerText = "";
    if (nextButton) nextButton.style.display = "none";
    if (coachMessageEl) coachMessageEl.innerText = "Listen to the pitch and try matching it!";
}

// Text-to-Speech pronunciation (iOS volume fixed)
if (listenButton) {
    listenButton.addEventListener('click', () => {
        if (currentIndex < 0 || !vocabularyDeck[currentIndex]) return;
        const currentItem = vocabularyDeck[currentIndex];
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(currentItem.korean);
            utterance.lang = 'ko-KR';
            utterance.volume = 1.0;
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
            if (coachMessageEl) coachMessageEl.innerText = "Listening closely helps your pitch!";
        } else {
            alert("Text-to-speech is not supported in this browser.");
        }
    });
}

// Speech Recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition && recordingButton) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recordingButton.addEventListener('click', () => {
        if (feedbackEl) {
            feedbackEl.innerText = "Listening...";
            feedbackEl.style.color = "#007aff";
        }
        if (transcriptionResult) transcriptionResult.innerText = "";
        if (coachMessageEl) coachMessageEl.innerText = "I'm listening to your pitch! Speak clearly.";
        try {
            recognition.start();
        } catch (e) {
            console.error(e);
        }
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        if (transcriptionResult) transcriptionResult.innerText = `You said: ${transcript}`;
        
        const targetText = vocabularyDeck[currentIndex].korean.replace(/[.,?!]/g, "").trim();
        const cleanedTranscript = transcript.replace(/[.,?!]/g, "").trim();

        if (cleanedTranscript === targetText) {
            if (feedbackEl) {
                feedbackEl.innerText = "Correct! 🎉";
                feedbackEl.className = "correct";
            }
            if (nextButton) nextButton.style.display = "block";
            if (coachMessageEl) coachMessageEl.innerText = "Wonderful job! Perfect pitch! 🌟";
        } else {
            if (feedbackEl) {
                feedbackEl.innerText = "Try again! 💪";
                feedbackEl.className = "incorrect";
            }
            if (coachMessageEl) coachMessageEl.innerText = "So close! Check your pitch and try again.";
        }
    };

    recognition.onerror = () => {
        if (feedbackEl) {
            feedbackEl.innerText = "Error recognizing speech. Try again.";
            feedbackEl.className = "incorrect";
        }
        if (coachMessageEl) coachMessageEl.innerText = "Oops, didn't catch that. Tap record again!";
    };
} else if (recordingButton) {
    recordingButton.style.display = "none";
    if (transcriptionResult) {
        transcriptionResult.innerText = "Speech recognition not supported in this browser. Use Safari or Chrome.";
    }
}

// Navigation buttons
if (nextButton) nextButton.addEventListener('click', getRandomPhrase);
if (skipButton) {
    skipButton.addEventListener('click', () => {
        if (coachMessageEl) coachMessageEl.innerText = "No worries, let's try a new one!";
        getRandomPhrase();
    });
}

// Add custom phrase handler
if (addButton) {
    addButton.addEventListener('click', () => {
        const kText = newKoreanInput ? newKoreanInput.value.trim() : "";
        const eText = newEnglishInput ? newEnglishInput.value.trim() : "";

        if (!kText) {
            alert("Please enter a Korean phrase.");
            return;
        }

        vocabularyDeck.push({
            korean: cleanKoreanText(kText),
            english: eText ? `(${eText})` : "(Custom phrase)"
        });

        saveVocabulary();

        if (newKoreanInput) newKoreanInput.value = "";
        if (newEnglishInput) newEnglishInput.value = "";
        if (feedbackEl) {
            feedbackEl.innerText = "Phrase added permanently! ✨";
            feedbackEl.style.color = "#5856d6";
        }
        if (coachMessageEl) coachMessageEl.innerText = "Added to your deck! Let's practice it!";
    });
}

// Screenshot OCR Handling
if (screenshotInput) {
    screenshotInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (ocrStatusEl) {
            ocrStatusEl.innerText = "Scanning full screenshot... 🔍";
            ocrStatusEl.style.color = "#007aff";
        }
        if (coachMessageEl) coachMessageEl.innerText = "Scanning and fixing Korean grammar spacing...";

        Tesseract.recognize(
            file,
            'kor+eng',
            { 
                logger: m => {
                    if (m.status === 'recognizing text' && ocrStatusEl) {
                        ocrStatusEl.innerText = `Reading & cleaning: ${Math.round(m.progress * 100)}%`;
                    }
                }
            }
        ).then(({ data: { text } }) => {
            if (ocrStatusEl) ocrStatusEl.innerText = "";
            parseAndBatchAddText(text);
            screenshotInput.value = "";
        }).catch(err => {
            console.error(err);
            if (ocrStatusEl) {
                ocrStatusEl.innerText = "Could not read image. Try a clearer shot.";
                ocrStatusEl.style.color = "#ff3b30";
            }
            if (coachMessageEl) coachMessageEl.innerText = "Hmm, couldn't read that image clearly.";
        });
    });
}

function parseAndBatchAddText(rawText) {
    const rawLines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let addedCount = 0;
    let currentKorean = "";

    for (let i = 0; i < rawLines.length; i++) {
        let line = rawLines[i];

        if (/[가-힣]/.test(line)) {
            line = cleanKoreanText(line);

            if (currentKorean) {
                vocabularyDeck.push({
                    korean: currentKorean,
                    english: "(Custom phrase)"
                });
                addedCount++;
            }
            currentKorean = line;
        } else if (currentKorean && line.length > 1) {
            vocabularyDeck.push({
                korean: currentKorean,
                english: `(${line.trim()})`
            });
            addedCount++;
            currentKorean = "";
        }
    }

    if (currentKorean) {
        vocabularyDeck.push({
            korean: cleanKoreanText(currentKorean),
            english: "(Custom phrase)"
        });
        addedCount++;
    }

    if (addedCount > 0) {
        saveVocabulary();
        if (feedbackEl) {
            feedbackEl.innerText = `Added ${addedCount} cleaned phrases! 🎉`;
            feedbackEl.className = "correct";
        }
        if (coachMessageEl) coachMessageEl.innerText = `Cleaned up and added ${addedCount} phrases to your deck! 🌟`;
        
        getRandomPhrase();
    } else {
        if (feedbackEl) {
            feedbackEl.innerText = "No clear Korean text detected.";
            feedbackEl.className = "incorrect";
        }
        if (coachMessageEl) coachMessageEl.innerText = "I couldn't find clear Korean text in that screenshot.";
    }
}

// Export JSON backup
if (exportButton) {
    exportButton.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vocabularyDeck, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "korean_vocabulary_backup.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        if (coachMessageEl) coachMessageEl.innerText = "Deck backed up successfully!";
    });
}

// Initial load setup
updateDeckCounter();
getRandomPhrase();