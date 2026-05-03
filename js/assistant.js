/**
 * Sylvex AI Assistant Module
 * Handles chat interactions and voice capabilities.
 */

const SylvexAssistant = {
    state: {
        isOpen: false,
        isListening: false,
        recognition: null,
        synthesis: window.speechSynthesis
    },

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.initVoice();
    },

    cacheDOM() {
        this.dom = {
            fab: document.getElementById('ai-fab'),
            window: document.getElementById('chat-window'),
            closeBtn: document.getElementById('close-chat'),
            messages: document.getElementById('chat-messages'),
            input: document.getElementById('chat-input'),
            sendBtn: document.getElementById('send-chat'),
            voiceBtn: document.getElementById('voice-btn')
        };
    },

    bindEvents() {
        this.dom.fab.addEventListener('click', () => this.toggleChat());
        this.dom.closeBtn.addEventListener('click', () => this.toggleChat());
        
        this.dom.sendBtn.addEventListener('click', () => this.handleSendMessage());
        this.dom.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });

        this.dom.voiceBtn.addEventListener('click', () => this.toggleVoice());
    },

    toggleChat() {
        this.state.isOpen = !this.state.isOpen;
        this.dom.window.classList.toggle('open', this.state.isOpen);
        if (this.state.isOpen) {
            this.dom.input.focus();
        }
    },

    initVoice() {
        if ('webkitSpeechRecognition' in window) {
            this.state.recognition = new webkitSpeechRecognition();
            this.state.recognition.continuous = false;
            this.state.recognition.interimResults = false;
            this.state.recognition.lang = 'en-US';

            this.state.recognition.onstart = () => {
                this.state.isListening = true;
                this.dom.voiceBtn.classList.add('listening');
            };

            this.state.recognition.onend = () => {
                this.state.isListening = false;
                this.dom.voiceBtn.classList.remove('listening');
            };

            this.state.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.dom.input.value = transcript;
                this.handleSendMessage();
            };

            this.state.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.state.isListening = false;
                this.dom.voiceBtn.classList.remove('listening');
            };
        } else {
            this.dom.voiceBtn.style.display = 'none';
        }
    },

    toggleVoice() {
        if (!this.state.recognition) return;
        if (this.state.isListening) {
            this.state.recognition.stop();
        } else {
            this.state.recognition.start();
        }
    },

    handleSendMessage() {
        const text = this.dom.input.value.trim();
        if (!text) return;

        this.addMessage(text, 'user');
        this.dom.input.value = '';

        // Simulate AI thinking
        setTimeout(() => {
            const response = this.generateAIResponse(text);
            this.addMessage(response, 'ai');
            this.speak(response);
        }, 1000);
    },

    addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text;
        this.dom.messages.appendChild(msgDiv);
        this.dom.messages.scrollTop = this.dom.messages.scrollHeight;
    },

    generateAIResponse(input) {
        const lowerInput = input.toLowerCase();
        
        if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
            return "Hello! I'm here to help you ace your exams. Have you uploaded your papers yet?";
        }
        
        if (lowerInput.includes('planner') || lowerInput.includes('schedule')) {
            return "Your study planner is optimized based on high-yield topics. I recommend focusing on " + 
                   (Sylvex.state.analysisData ? Sylvex.state.analysisData.topics[0].name : "your main module") + 
                   " today for the best results.";
        }

        if (lowerInput.includes('topic') || lowerInput.includes('yield')) {
            if (!Sylvex.state.isAnalyzed) return "Please run the analysis first so I can see the trends!";
            return "According to my analysis, " + Sylvex.state.analysisData.topics[0].name + 
                   " has a " + Sylvex.state.analysisData.topics[0].weight + "% weightage in recent years.";
        }

        return "That's an interesting question! Based on historical trends, focusing on recurring patterns in your syllabus is the best way to prepare. Would you like me to explain a specific topic?";
    },

    speak(text) {
        if (!this.state.synthesis) return;
        // Cancel any ongoing speech
        this.state.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        this.state.synthesis.speak(utterance);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    SylvexAssistant.init();
});
