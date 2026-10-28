// Default baseline vocabulary deck
const defaultVocabulary = [
    { korean: "안녕하세요", english: "(Hello)" },
    { korean: "감사합니다", english: "(Thank you)" },
    { korean: "사랑해요", english: "(I love you)" },
    { korean: "반갑습니다", english: "(Nice to meet you)" },
    { korean: "잘 지내세요?", english: "(How have you been?)" }
];

let vocabularyDeck = loadVocabulary();
let lastAddedBatchCount = 0; // Tracks last batch size for Undo

function loadVocabulary() {
    const saved = localStorage.getItem('korean_custom_deck');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (e) {
            console.error("Error loading saved deck", e);
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
        counter.innerText = `Practice Deck: ${vocabularyDeck.length} phrases (Tap to manage)`;
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
const batchInput = document.getElementById('batch-input');
const batchAddButton = document.getElementById('batch-add-button');
const undoButton = document.getElementById('undo-button');
const exportButton = document.getElementById('export-button');

const deckCounterEl = document.getElementById('deck-counter');
const deckModal = document.getElementById('deck-modal');
const closeModal = document.getElementById('close-modal');
const deckListEl = document.getElementById('deck-list');

// Intelligent cleaner: Removes leading numbers and extracts English
function parseAndCleanLine(line) {
    // 1. Remove leading numbers (e.g., "161 목" -> "목")
    let cleaned = line.replace(/^\d+\s*/, '').trim();

    // 2. Separate English words if present on the same line (e.g., "목 neck throat")
    const englishMatch = cleaned.match(/[a-zA-Z\s,()]+$/);
    let englishPart = "";
    
    if (englishMatch && englishMatch[0].trim().length > 1) {
        englishPart = englishMatch[0].trim();
        cleaned = cleaned.replace(englishMatch[0], '').trim();
    }

    // 3. Clean Korean spacing & particles
    cleaned = cleaned
        .replace(/[^가-힣a-zA-Z0-9\s.,?!~]/g, '')
        .replace(/\s+([요을를은는이가에도서로으로과와박밖에]+)(\s|$)/g, '$1$2')
        .replace(/\s+([요]+)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();

    return {
        korean: cleaned,
        english: englishPart ? `(${englishPart})` : ""
    };
}

// Pick a random phrase
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

// DIRECT AUDIO STREAM TTS (Bypasses iOS Speech Engine Restrictions)
let activeAudio = null;

if (listenButton) {
    listenButton.addEventListener('click', () => {
        if (currentIndex < 0 || !vocabularyDeck[currentIndex]) return;
        const currentItem = vocabularyDeck[currentIndex];
        
        // Stop any currently playing audio
        if (activeAudio) {
            activeAudio.pause();
            activeAudio = null;
        }

        const encodedText = encodeURIComponent(currentItem.korean);
        const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=ko&client=tw-ob`;
        
        activeAudio = new Audio(audioUrl);
        
        activeAudio.play().then(() => {
            if (coachMessageEl) coachMessageEl.innerText = "Listening closely helps your pitch!";
        }).catch(err => {
            console.error("Audio playback error:", err);
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(currentItem.korean);
                utterance.lang = 'ko-KR';
                window.speechSynthesis.speak(utterance);
            }
        });
    });
}

// Speech Recognition
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
        try { recognition.start(); } catch (e) { console.error(e); }
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
}

// Navigation
if (nextButton) nextButton.addEventListener('click', getRandomPhrase);
if (skipButton) {
    skipButton.addEventListener('click', () => {
        if (coachMessageEl) coachMessageEl.innerText = "No worries, let's try a new one!";
        getRandomPhrase();
    });
}

// Add single custom phrase
if (addButton) {
    addButton.addEventListener('click', () => {
        const kText = newKoreanInput ? newKoreanInput.value.trim() : "";
        const eText = newEnglishInput ? newEnglishInput.value.trim() : "";

        if (!kText) {
            alert("Please enter a Korean phrase.");
            return;
        }

        const parsed = parseAndCleanLine(kText);
        vocabularyDeck.push({
            korean: parsed.korean,
            english: eText ? `(${eText})` : (parsed.english || "(Custom phrase)")
        });

        saveVocabulary();
        if (newKoreanInput) newKoreanInput.value = "";
        if (newEnglishInput) newEnglishInput.value = "";
        if (feedbackEl) {
            feedbackEl.innerText = "Phrase added permanently! ✨";
            feedbackEl.style.color = "#5856d6";
        }
    });
}

// Batch import multiple phrases
if (batchAddButton) {
    batchAddButton.addEventListener('click', () => {
        const rawText = batchInput ? batchInput.value.trim() : "";
        if (!rawText) {
            alert("Please paste text into the box first.");
            return;
        }

        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let addedCount = 0;
        let pendingKorean = "";

        for (let i = 0; i < lines.length; i++) {
            const parsed = parseAndCleanLine(lines[i]);
            
            if (parsed.korean) {
                if (pendingKorean) {
                    vocabularyDeck.push({ korean: pendingKorean, english: "(Custom phrase)" });
                    addedCount++;
                }
                pendingKorean = parsed.korean;
                
                if (parsed.english) {
                    vocabularyDeck.push({ korean: pendingKorean, english: parsed.english });
                    addedCount++;
                    pendingKorean = "";
                }
            }
        }

        if (pendingKorean) {
            vocabularyDeck.push({ korean: pendingKorean, english: "(Custom phrase)" });
            addedCount++;
        }

        if (addedCount > 0) {
            lastAddedBatchCount = addedCount;
            saveVocabulary();
            if (batchInput) batchInput.value = "";
            if (feedbackEl) {
                feedbackEl.innerText = `Imported ${addedCount} clean phrases! 🎉`;
                feedbackEl.className = "correct";
            }
            if (coachMessageEl) coachMessageEl.innerText = `Added ${addedCount} clean phrases to your deck! 🌟`;
            if (undoButton) undoButton.style.display = "block";
            getRandomPhrase();
        } else {
            alert("No valid Korean text found.");
        }
    });
}

// Undo Last Batch Import
if (undoButton) {
    undoButton.addEventListener('click', () => {
        if (lastAddedBatchCount > 0 && vocabularyDeck.length >= lastAddedBatchCount) {
            vocabularyDeck.splice(-lastAddedBatchCount);
            saveVocabulary();
            if (feedbackEl) {
                feedbackEl.innerText = `Reverted last import (${lastAddedBatchCount} phrases removed) ↩️`;
                feedbackEl.className = "incorrect";
            }
            if (coachMessageEl) coachMessageEl.innerText = "Undid the last import!";
            lastAddedBatchCount = 0;
            undoButton.style.display = "none";
            getRandomPhrase();
        }
    });
}

// Deck Manager Modal Controls
if (deckCounterEl) {
    deckCounterEl.addEventListener('click', () => {
        renderDeckList();
        if (deckModal) deckModal.style.display = "flex";
    });
}
if (closeModal) {
    closeModal.addEventListener('click', () => {
        if (deckModal) deckModal.style.display = "none";
        getRandomPhrase();
    });
}

function renderDeckList() {
    if (!deckListEl) return;
    deckListEl.innerHTML = "";
    vocabularyDeck.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = "deck-item";
        div.innerHTML = `<span><b>${item.korean}</b> ${item.english}</span> <button class="delete-btn" data-index="${index}">Delete</button>`;
        deckListEl.appendChild(div);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'));
            vocabularyDeck.splice(idx, 1);
            saveVocabulary();
            renderDeckList();
        });
    });
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
    });
}

// Initial load setup
updateDeckCounter();
getRandomPhrase();