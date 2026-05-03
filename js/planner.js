/**
 * Sylvex Planner Module 2.0
 * Handles study schedule generation and task management.
 */

const SylvexPlanner = {
    timer: {
        interval: null,
        timeLeft: 1500, // 25 mins
        isActive: false
    },

    init() {
        console.log('Sylvex Planner Initialized');
        // Initial render if analysis is already done
        if (Sylvex.state.isAnalyzed) {
            this.render();
        }
    },

    render() {
        const topics = Sylvex.state.analysisData ? Sylvex.state.analysisData.topics : [];
        if (topics.length === 0) return;

        const days = 7;
        const today = new Date();
        const container = document.getElementById('calendar-view');
        if (!container) return;

        let html = '';
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            const activeClass = i === Sylvex.state.planner.selectedDayIdx ? 'active' : '';

            html += `
                <div class="day-tile ${activeClass}" onclick="SylvexPlanner.selectDay(${i})">
                    <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.5rem">
                        ${date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                    </div>
                    <div style="font-weight: 600">${topics[i % topics.length].name}</div>
                </div>
            `;
        }

        container.innerHTML = html;
        this.renderDayDetail();
    },

    selectDay(idx) {
        Sylvex.state.planner.selectedDayIdx = idx;
        this.render();
    },

    renderDayDetail() {
        const idx = Sylvex.state.planner.selectedDayIdx;
        const topic = Sylvex.state.analysisData.topics[idx % Sylvex.state.analysisData.topics.length];
        const hours = Sylvex.state.planner.hoursPerDay;
        const container = document.getElementById('day-detail-card');
        if (!container) return;

        const tasks = this.generateTasks(topic, Sylvex.state.planner.intensity);

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start">
                <div>
                    <h2 style="margin-bottom: 0.5rem">${topic.name}</h2>
                    <p class="text-dim">Focus on high-yield patterns: ${topic.pattern}</p>
                </div>
                <div class="badge" style="background: var(--primary-glow); color: var(--primary-light); padding: 0.5rem 1rem; border-radius: 8px">
                    ${hours}h Session
                </div>
            </div>
            
            <div class="mt-4">
                <h4 style="margin-bottom: 1rem; color: var(--secondary-light)">Recommended Tasks</h4>
                <div class="ranking-list">
                    ${tasks.map(task => `
                        <div class="ranking-item" style="padding: 0.8rem">
                            <i data-lucide="circle" size="18" style="color: var(--text-dim)"></i>
                            <span>${task}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="timer-container fade-up">
                <h4 style="color: var(--secondary-light)">Focus Mode: ${topic.name}</h4>
                <div class="timer-display" id="pomodoro-display">25:00</div>
                <div class="timer-controls">
                    <button class="btn btn-primary" id="timer-toggle-btn" onclick="SylvexPlanner.toggleTimer()">Start Session</button>
                    <button class="btn btn-secondary" onclick="SylvexPlanner.resetTimer()">Reset</button>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
        this.updateTimerDisplay();
    },

    toggleTimer() {
        const btn = document.getElementById('timer-toggle-btn');
        if (this.timer.isActive) {
            clearInterval(this.timer.interval);
            this.timer.isActive = false;
            btn.textContent = 'Resume';
            btn.className = 'btn btn-primary';
        } else {
            this.timer.isActive = true;
            btn.textContent = 'Pause';
            btn.className = 'btn btn-secondary';
            this.timer.interval = setInterval(() => {
                this.timer.timeLeft--;
                this.updateTimerDisplay();
                if (this.timer.timeLeft <= 0) {
                    clearInterval(this.timer.interval);
                    this.timer.isActive = false;
                    alert('Session Complete! Take a short break.');
                    this.resetTimer();
                }
            }, 1000);
        }
    },

    resetTimer() {
        clearInterval(this.timer.interval);
        this.timer.isActive = false;
        this.timer.timeLeft = 1500;
        this.updateTimerDisplay();
        const btn = document.getElementById('timer-toggle-btn');
        if (btn) {
            btn.textContent = 'Start Session';
            btn.className = 'btn btn-primary';
        }
    },

    updateTimerDisplay() {
        const display = document.getElementById('pomodoro-display');
        if (!display) return;
        const mins = Math.floor(this.timer.timeLeft / 60);
        const secs = this.timer.timeLeft % 60;
        display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    generateTasks(topic, intensity) {
        const baseTasks = [
            `Solve 5 ${topic.name} questions from 2024 paper`,
            `Review theory for ${topic.name} conceptual shifts`,
            `Practice timed mock section for this module`
        ];

        if (intensity === 'intense') {
            baseTasks.push(`Analyze marking scheme for ${topic.name} multi-part questions`);
            baseTasks.push(`Compare 2022 vs 2024 phrasing for ${topic.name}`);
        } else if (intensity === 'light') {
            return [baseTasks[0], baseTasks[1]]; // Only top 2 for light intensity
        }

        return baseTasks;
    }
};

// Global export
window.SylvexPlanner = SylvexPlanner;
