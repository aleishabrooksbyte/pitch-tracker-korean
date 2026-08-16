// speech-api.js
const targetWordDisplay = document.getElementById("target-word");
const englishMeaningDisplay = document.getElementById("english-meaning");
const recordingButton = document.getElementById("recording-button");
const listenButton = document.getElementById("listen-button");
const nextButton = document.getElementById("next-button");
const transcriptionResult = document.getElementById("transcription-result");
const feedback = document.getElementById("feedback");

let isRecording = false;
let currentWordIndex = 0;

// Our mini-curriculum of words
const vocabulary = [
    { korean: "안녕하세요", english: "(Hello)" },
    { korean: "감사합니다", english: "(Thank you)" },
    { korean: "미안해", english: "(Sorry - Informal)" },
    { korean: "진짜", english: "(Really?)" },
    { korean: "왜 그래", english: "(Why are you being like this?)" }
];

// Initialize Speech Recognition (The Ears)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (typeof SpeechRecognition !== "undefined") {
    recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR'; 
    recognition.continuous = false; // Stop listening after one phrase
    recognition.interimResults = true; 

    recognition.addEventListener("result", (event) => {
        let currentTranscript = "";
        for (const result of event.results) {
            currentTranscript += result[0].transcript;
        }
        
        transcriptionResult.textContent = currentTranscript;

        // Check if the user is finished speaking
        if (event.results[0].isFinal) {
            // Clean up the text (remove spaces/punctuation for a fair comparison)
            let spokenClean = currentTranscript.replace(/\s+/g, '').trim();
            let targetClean = vocabulary[currentWordIndex].korean.replace(/\s+/g, '').trim();

            if (spokenClean === targetClean) {
                feedback.textContent = "✅ Correct!";
                feedback.className = "correct";
                nextButton.style.display = "inline-block"; // Show next button
            } else {
                feedback.textContent = "❌ Try again. You said: " + currentTranscript;
                feedback.className = "incorrect";
            }
            
            // Auto-stop recording when done
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

// Text-to-Speech (The Mouth)
listenButton.addEventListener("click", () => {
    const utterance = new SpeechSynthesisUtterance(vocabulary[currentWordIndex].korean);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.8; // Slightly slower for practice
    window.speechSynthesis.speak(utterance);
});

// Move to the next word
nextButton.addEventListener("click", () => {
    currentWordIndex++;
    if (currentWordIndex >= vocabulary.length) {
        currentWordIndex = 0; // Loop back to the start
    }
    
    // Update display
    targetWordDisplay.textContent = vocabulary[currentWordIndex].korean;
    englishMeaningDisplay.textContent = vocabulary[currentWordIndex].english;
    
    // Reset UI
    transcriptionResult.textContent = "";
    feedback.textContent = "";
    nextButton.style.display = "none";
});