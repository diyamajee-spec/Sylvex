/**
 * Sylvex Engine 2.0
 * Core Logic & State Management
 */

const Sylvex = {
    state: {
        papers: [],
        syllabus: null,
        isAnalyzed: false,
        analysisData: null,
        planner: {
            examDate: null,
            hoursPerDay: 4,
            intensity: 'moderate',
            selectedDayIdx: 0
        }
    },

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.initLucide();
        this.setupNavbarScroll();
        this.initImpressiveEffects();
    },

    cacheDOM() {
        this.dom = {
            navbar: document.getElementById('navbar'),
            paperInput: document.getElementById('paper-input'),
            syllabusInput: document.getElementById('syllabus-input'),
            paperList: document.getElementById('paper-file-list'),
            syllabusList: document.getElementById('syllabus-file-list'),
            analyzeBtn: document.getElementById('analyze-btn'),
            dashboard: document.getElementById('dashboard'),
            planner: document.getElementById('planner'),

            // Stats
            readiness: document.getElementById('readiness-value'),
            topicCount: document.getElementById('topic-count'),
            coverageGap: document.getElementById('coverage-gap'),
            rankingList: document.getElementById('topic-ranking-list'),

            // Planner
            hoursRange: document.getElementById('hours-range'),
            hoursDisplay: document.getElementById('hours-display'),
            examDateInput: document.getElementById('exam-date-input'),
            intensityButtons: document.getElementById('intensity-buttons'),
            genPlanBtn: document.getElementById('generate-plan-btn'),
            calendarView: document.getElementById('calendar-view'),
            dayDetailCard: document.getElementById('day-detail-card')
        };
    },

    bindEvents() {
        // File Handling
        this.dom.paperInput.addEventListener('change', (e) => this.handleFiles(e.target.files, 'papers'));
        this.dom.syllabusInput.addEventListener('change', (e) => this.handleFiles(e.target.files, 'syllabus'));

        // Drag & Drop
        this.setupDropzone('paper-dropzone', (files) => this.handleFiles(files, 'papers'));
        this.setupDropzone('syllabus-dropzone', (files) => this.handleFiles(files, 'syllabus'));

        // Global Drag & Drop
        this.setupGlobalDragAndDrop();

        // Analysis
        this.dom.analyzeBtn.addEventListener('click', () => this.runAnalysis());

        // Planner Controls
        this.dom.hoursRange.addEventListener('input', (e) => {
            this.state.planner.hoursPerDay = e.target.value;
            this.dom.hoursDisplay.textContent = `${e.target.value}h`;
        });

        this.dom.genPlanBtn.addEventListener('click', () => SylvexPlanner.render());

        // Intensity Buttons
        document.querySelectorAll('.intensity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.intensity-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.planner.intensity = btn.dataset.value;
            });
        });

        // Nav Links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href').substring(1);
                if (targetId && this.state.isAnalyzed) {
                    e.preventDefault();
                    document.getElementById(targetId).scrollIntoView({ behavior: 'smooth' });
                    this.updateActiveNavLink(link);
                }
            });
        });
    },

    initLucide() {
        if (window.lucide) window.lucide.createIcons();
    },

    setupNavbarScroll() {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                this.dom.navbar.classList.add('scrolled');
            } else {
                this.dom.navbar.classList.remove('scrolled');
            }
        });
    },

    setupGlobalDragAndDrop() {
        const overlay = document.getElementById('global-drop-zone');
        
        window.addEventListener('dragenter', (e) => {
            e.preventDefault();
            overlay.classList.add('active');
        });

        overlay.addEventListener('dragleave', (e) => {
            e.preventDefault();
            overlay.classList.remove('active');
        });

        overlay.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        overlay.addEventListener('drop', (e) => {
            e.preventDefault();
            overlay.classList.remove('active');
            
            if (e.dataTransfer.files.length > 0) {
                // Determine if it's a paper or syllabus based on current view or just treat as papers
                this.handleFiles(e.dataTransfer.files, 'papers');
                // Auto-scroll to analyzer if not there
                document.getElementById('analyzer').scrollIntoView({ behavior: 'smooth' });
            }
        });
    },

    setupDropzone(id, callback) {
        const zone = document.getElementById(id);
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            callback(e.dataTransfer.files);
        });
    },

    handleFiles(files, type) {
        const fileArr = Array.from(files);
        if (type === 'papers') {
            this.state.papers = [...this.state.papers, ...fileArr];
            this.renderFileList(this.dom.paperList, this.state.papers, 'papers');
        } else {
            this.state.syllabus = fileArr[0];
            this.renderFileList(this.dom.syllabusList, [this.state.syllabus], 'syllabus');
        }
        this.updateAnalyzeButton();
    },

    renderFileList(container, files, type) {
        container.innerHTML = files.map((file, idx) => `
            <div class="file-chip">
                <i data-lucide="file-text" size="14"></i>
                <span>${file.name}</span>
                <i data-lucide="x" size="14" style="cursor:pointer" onclick="Sylvex.removeFile(${idx}, '${type}')"></i>
            </div>
        `).join('');
        this.initLucide();
    },

    removeFile(idx, type) {
        if (type === 'papers') {
            this.state.papers.splice(idx, 1);
            this.renderFileList(this.dom.paperList, this.state.papers, 'papers');
        } else {
            this.state.syllabus = null;
            this.dom.syllabusList.innerHTML = '';
        }
        this.updateAnalyzeButton();
    },

    updateAnalyzeButton() {
        this.dom.analyzeBtn.disabled = this.state.papers.length === 0;
    },

    async runAnalysis() {
        this.dom.analyzeBtn.innerHTML = `<span>Synthesizing Patterns...</span><div class="spinner"></div>`;
        this.dom.analyzeBtn.disabled = true;

        // Create OCR Overlay
        const overlay = document.createElement('div');
        overlay.className = 'ocr-overlay';
        overlay.innerHTML = `
            <div class="data-stream" id="data-stream"></div>
            <div class="scan-line"></div>
            <div style="z-index: 10; text-align: center">
                <h1 class="gradient-text" style="font-size: 3rem">Neural Pattern Synthesis</h1>
                <p id="ocr-status" style="color: var(--primary-light); font-family: monospace">Initializing OCR Engine...</p>
            </div>
        `;
        document.body.appendChild(overlay);

        const statusText = document.getElementById('ocr-status');
        const stream = document.getElementById('data-stream');
        const statuses = [
            "Extracting text from PDF layers...",
            "Identifying recurring keywords...",
            "Mapping frequency against syllabus...",
            "Calculating yield importance...",
            "Optimizing study roadmap..."
        ];

        // Start Data Stream Animation
        const streamInterval = setInterval(() => {
            const frag = document.createElement('div');
            frag.className = 'data-fragment';
            frag.style.left = Math.random() * 100 + '%';
            frag.style.top = Math.random() * 100 + '%';
            frag.textContent = this.getRandomFragment();
            stream.appendChild(frag);
            setTimeout(() => frag.remove(), 1500);
        }, 50);

        // Update Statuses
        for (let i = 0; i < statuses.length; i++) {
            statusText.textContent = statuses[i];
            await new Promise(r => setTimeout(r, 600));
        }

        clearInterval(streamInterval);
        overlay.remove();

        // Trigger Achievement
        this.showAchievement();

        this.state.isAnalyzed = true;
        this.generateMockData();

        this.dom.dashboard.classList.remove('hidden');
        this.dom.planner.classList.remove('hidden');

        this.renderDashboard();
        SylvexPlanner.render();

        this.dom.dashboard.scrollIntoView({ behavior: 'smooth' });
        this.dom.analyzeBtn.innerHTML = `<span>Analysis Complete</span><i data-lucide="check"></i>`;
        this.initLucide();
    },

    getRandomFragment() {
        const fragments = ["0x8B5CF6", "INTEGRATION", "DERIVATIVE", "MATRIX_RANK", "PROBABILITY", "SYLLABUS_MATCH", "YIELD_HIGH", "PATTERN_EXTRACTED", "EIGEN_VAL", "VECTOR_SPACE"];
        return fragments[Math.floor(Math.random() * fragments.length)];
    },

    generateMockData() {
        this.state.analysisData = {
            readiness: 68,
            topics: [
                { id: 1, name: 'Differential Equations', weight: 94, trend: 'Increasing', pattern: 'Appears in every final since 2021' },
                { id: 2, name: 'Linear Algebra (Matrices)', weight: 82, trend: 'Stable', pattern: 'High weightage in Section B' },
                { id: 3, name: 'Probability Theory', weight: 75, trend: 'Fluctuating', pattern: 'Focus on Bayes Theorem' },
                { id: 4, name: 'Vector Calculus', weight: 64, trend: 'New Pattern', pattern: 'Shift towards conceptual proofs' }
            ],
            coverageGap: 24,
            trends: {
                labels: ['2021', '2022', '2023', '2024', '2025'],
                datasets: [
                    { label: 'Calculus', data: [12, 18, 15, 22, 28] },
                    { label: 'Algebra', data: [8, 12, 10, 15, 14] }
                ]
            }
        };
    },

    renderDashboard() {
        const data = this.state.analysisData;

        // Update Stats
        this.dom.readiness.textContent = `${data.readiness}%`;
        this.dom.topicCount.textContent = data.topics.length;
        this.dom.coverageGap.textContent = `${data.coverageGap}%`;

        // Render Rankings
        this.dom.rankingList.innerHTML = data.topics.map((t, idx) => `
            <div class="ranking-item fade-up" style="animation-delay: ${idx * 0.1}s">
                <div class="rank-badge">${idx + 1}</div>
                <div class="topic-info">
                    <span class="topic-name">${t.name}</span>
                    <span class="topic-meta">${t.trend} Yield | Phrasing Shift: ${idx % 2 === 0 ? 'Describe → Evaluate' : 'Solve → Prove'}</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem">
                    <div class="yield-meter">
                        <div class="yield-fill" style="width: ${t.weight}%"></div>
                    </div>
                    <button class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem" onclick="Sylvex.showPractice('${t.name}')">
                        <i data-lucide="help-circle" size="12"></i> Practice
                    </button>
                </div>
            </div>
        `).join('');

        this.renderCharts();
        this.renderHeatmap();
    },

    renderHeatmap() {
        const heatmapContainer = document.createElement('div');
        heatmapContainer.className = 'col-12 glass-card fade-up';
        heatmapContainer.style.animationDelay = '0.6s';
        heatmapContainer.innerHTML = `
            <h3>Historical Frequency Heatmap</h3>
            <p class="text-dim mb-4">Patterns identified across 24 historical assessment modules</p>
            <div class="heatmap-grid" id="heatmap-grid"></div>
            <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; font-size: 0.7rem; color: var(--text-dim)">
                <span>Less Frequent</span>
                <div style="display: flex; gap: 4px">
                    <div class="heatmap-cell" style="width: 12px; height: 12px"></div>
                    <div class="heatmap-cell level-1" style="width: 12px; height: 12px"></div>
                    <div class="heatmap-cell level-2" style="width: 12px; height: 12px"></div>
                    <div class="heatmap-cell level-3" style="width: 12px; height: 12px"></div>
                    <div class="heatmap-cell level-4" style="width: 12px; height: 12px"></div>
                </div>
                <span>High Yield</span>
            </div>
        `;

        const target = document.getElementById('heatmap-target') || this.dom.dashboard.querySelector('.dashboard-grid');
        target.appendChild(heatmapContainer);

        const grid = document.getElementById('heatmap-grid');
        for (let i = 0; i < 24; i++) {
            const level = Math.floor(Math.random() * 5);
            const cell = document.createElement('div');
            cell.className = `heatmap-cell ${level > 0 ? 'level-' + level : ''}`;
            cell.innerHTML = `<div class="heatmap-tooltip">Module ${i + 1}: ${level * 20}% Frequency</div>`;
            grid.appendChild(cell);
        }
    },

    renderCharts() {
        const ctxTrend = document.getElementById('trendChart').getContext('2d');
        const ctxDiff = document.getElementById('difficultyChart').getContext('2d');

        // Topic Frequency Chart
        new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: this.state.analysisData.trends.labels,
                datasets: this.state.analysisData.trends.datasets.map((ds, i) => ({
                    ...ds,
                    borderColor: i === 0 ? '#8B5CF6' : '#06B6D4',
                    background: i === 0
                        ? 'linear-gradient(180deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%)'
                        : 'transparent',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: i === 0 ? '#8B5CF6' : '#06B6D4',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                    fill: i === 0
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            color: '#94A3B8',
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 20,
                            font: { family: 'Inter', size: 12, weight: '500' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(12, 17, 26, 0.95)',
                        titleFont: { family: 'Outfit', size: 14, weight: '700' },
                        bodyFont: { family: 'Inter', size: 13 },
                        padding: 12,
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        displayColors: true,
                        usePointStyle: true
                    }
                },
                interaction: { intersect: false, mode: 'index' },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748B', font: { size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
                        ticks: { color: '#64748B', font: { size: 11 }, padding: 10 }
                    }
                }
            }
        });

        // Difficulty Bar Chart
        new Chart(ctxDiff, {
            type: 'bar',
            data: {
                labels: ['Concept Mastery', 'Application', 'Problem Solving', 'Critical Thinking'],
                datasets: [{
                    label: 'Pattern Distribution',
                    data: [45, 30, 20, 5],
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.5)',
                        'rgba(139, 92, 246, 0.35)',
                        'rgba(139, 92, 246, 0.2)',
                        'rgba(139, 92, 246, 0.1)'
                    ],
                    hoverBackgroundColor: '#8B5CF6',
                    borderRadius: 6,
                    borderSkipped: false,
                    barThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(12, 17, 26, 0.95)',
                        padding: 12,
                        titleFont: { family: 'Outfit', size: 14 },
                        bodyFont: { family: 'Inter', size: 13 }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { 
                            color: '#F1F5F9', // High contrast
                            font: { family: 'Inter', size: 12, weight: '600' } 
                        }
                    },
                    y: {
                        display: true,
                        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
                        ticks: { 
                            color: '#94A3B8', 
                            font: { size: 11 },
                            callback: (val) => val + '%'
                        }
                    }
                }
            }
        });
    },

    showPractice(topic) {
        alert(`Sylvex AI Recommendations for ${topic}:\n\n1. "The Phrasing Shift": Practice questions where ${topic} is combined with other modules (Common in 2023-2024).\n2. "High Impact Mock": Solve Mock Q7 & Q12 specifically designed for this pattern.\n3. "Smart Review": Re-read Section 4.2 of your syllabus for edge cases.`);
    },

    updateActiveNavLink(activeLink) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        activeLink.classList.add('active');
    },
    showAchievement() {
        const popup = document.getElementById('achievement-popup');
        popup.classList.add('active');
        setTimeout(() => popup.classList.remove('active'), 5000);
    },

    initImpressiveEffects() {
        // 1. Cursor Glow
        const glow = document.getElementById('cursor-glow');
        window.addEventListener('mousemove', (e) => {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
        });

        // 2. Particle Background
        const canvas = document.getElementById('bg-canvas');
        const ctx = canvas.getContext('2d');
        let particles = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random();
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
            }
            draw() {
                ctx.fillStyle = `rgba(139, 92, 246, ${this.opacity * 0.5})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < 100; i++) particles.push(new Particle());

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animate);
        };
        animate();
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    Sylvex.init();

    // Add some polish: smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target && !target.classList.contains('hidden')) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

// Global export for inline onclick handlers
window.Sylvex = Sylvex;
