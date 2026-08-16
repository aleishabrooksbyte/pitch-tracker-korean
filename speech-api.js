// speech-api.js
const targetWordDisplay = document.getElementById("target-word");
const englishMeaningDisplay = document.getElementById("english-meaning");
const recordingButton = document.getElementById("recording-button");
const listenButton = document.getElementById("listen-button");
const nextButton = document.getElementById("next-button");
const skipButton = document.getElementById("skip-button");
const transcriptionResult = document.getElementById("transcription-result");
const feedback = document.getElementById("feedback");

const newKoreanInput = document.getElementById("new-korean");
const newEnglishInput = document.getElementById("new-english");
const addButton = document.getElementById("add-button");

let isRecording = false;
let currentWordIndex = 0;

// Expanded curated baseline vocabulary (Drama & Script focused)
const vocabulary = [
    { korean: "안녕하세요", english: "(Hello)" },
    { korean: "이 대본 어때요?", english: "(How is this script?)" },
    { korean: "밥 먹었어요?", english: "(Did you eat?)" },
    { korean: "저는 뱀파이어입니다", english: "(I am a vampire)" },
    { korean: "진짜 웃겨요", english: "(It is really funny)" },
    { korean: "다시 한 번 해볼게요", english: "(I will try it one more time)" },
    { korean: "조금만 천천히 말해 주세요", english: "(Please speak a little slower)" },
    { korean: "오늘 날씨가 참 좋네요", english: "(The weather is really nice today)" },
    { korean: "무슨 일 이에요?", english: "(What's going on? / What's the matter?)" },
    { korean: "잠깐만요", english: "(Just a moment / Wait a second)" },
    { korean: "믿을 수가 없어", english: "(I can't believe it)" },
    { korean: "어떻게 알았어요?", english: "(How did you know?)" },
    { korean: "정말 미안해요", english: "(I'm really sorry)" }
];

function updateDisplay() {
    targetWordDisplay.textContent = vocabulary[currentWordIndex].korean;
    englishMeaningDisplay.textContent = vocabulary[currentWordIndex].english;
    transcriptionResult.textContent = "";
    feedback.textContent = "";
    nextButton.style.display = "none";
    skipButton.style.display = "inline-block";
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (typeof SpeechRecognition !== "undefined") {
    recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR'; 
    recognition.continuous = false; 
    recognition.interimResults = true; 

    recognition.addEventListener("result", (event) => {
        let currentTranscript = "";
        for (const result of event.results) {
            currentTranscript += result[0].transcript;
        }
        
        transcriptionResult.textContent = currentTranscript;

        if (event.results[0].isFinal) {
            let spokenClean = currentTranscript.replace(/[\s.,?!]/g, '').trim();
            let targetClean = vocabulary[currentWordIndex].korean.replace(/[\s.,?!]/g, '').trim();

            if (spokenClean === targetClean) {
                feedback.textContent = "✅ Correct!";
                feedback.className = "correct";
                nextButton.style.display = "inline-block";
                skipButton.style.display = "none";
            } else {
                feedback.textContent = "❌ Try again. You said: " + currentTranscript;
                feedback.className = "incorrect";
            }
            
            isRecording = false;
            recordingButton.textContent = "🎤 Start Recording";
        }
    });

    recordingButton.addEventListener("click", () => {
        if (isRecording) {
            recognition.stop();
            isRecording = false;
            recordingButton.textContent = "🎤 Start Recording";
        } else {
            transcriptionResult.textContent = "...listening...";
            feedback.textContent = "";
            recognition.start();
            isRecording = true;
            recordingButton.textContent = "🛑 Stop Recording";
        }
    });
} else {
    recordingButton.style.display = "none";
    transcriptionResult.textContent = "Speech Recognition not supported on this browser.";
}

listenButton.addEventListener("click", () => {
    const utterance = new SpeechSynthesisUtterance(vocabulary[currentWordIndex].korean);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
});

// Randomize to the next phrase (avoids immediate duplicates)
function goToNextPhrase() {
    if (vocabulary.length <= 1) return;
    
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * vocabulary.length);
    } while (randomIndex === currentWordIndex);

    currentWordIndex = randomIndex;
    updateDisplay();
}

nextButton.addEventListener("click", goToNextPhrase);
skipButton.addEventListener("click", goToNextPhrase);

addButton.addEventListener("click", () => {
    const kText = newKoreanInput.value.trim();
    const eText = newEnglishInput.value.trim();

    if (kText !== "") {
        vocabulary.push({ 
            korean: kText, 
            english: eText ? `(${eText})` : "(Custom Phrase)" 
        });
        
        newKoreanInput.value = "";
        newEnglishInput.value = "";
        
        currentWordIndex = vocabulary.length - 1;
        updateDisplay();
        
        alert("Phrase added to your active practice deck!");
    } else {
        alert("Please enter at least the Korean text.");
    }
});

// Initialize first phrase view
updateDisplay();