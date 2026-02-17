/**
 * Hockey Rules - Quiz Functionality
 * Handles interactive quiz system with multiple-choice questions
 */

const quizState = {
    difficulty: null,
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    answered: false
};

let quizStartScreen;
let quizQuestionScreen;
let quizResultsScreen;

/**
 * Initialize quiz functionality
 */
function initQuiz() {
    quizStartScreen = document.getElementById('quizStart');
    quizQuestionScreen = document.getElementById('quizQuestion');
    quizResultsScreen = document.getElementById('quizResults');
    
    // Difficulty selection buttons
    document.querySelectorAll('.btn-difficulty').forEach(btn => {
        btn.addEventListener('click', () => startQuiz(btn.dataset.difficulty));
    });
    
    // Next question button
    const nextBtn = document.getElementById('nextQuestion');
    if (nextBtn) {
        nextBtn.addEventListener('click', nextQuestion);
    }
    
    // Restart quiz button
    const restartBtn = document.getElementById('restartQuiz');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            resetQuizState();
            showScreen('start');
        });
    }
}

/**
 * Start quiz with selected difficulty
 */
function startQuiz(difficulty) {
    if (!window.appState || !window.appState.quiz) {
        window.showToast('Quiz-Daten konnten nicht geladen werden', 'error');
        return;
    }
    
    quizState.difficulty = difficulty;
    quizState.currentQuestionIndex = 0;
    quizState.score = 0;
    quizState.answered = false;
    
    // Filter questions by difficulty and select random ones
    const allQuestions = window.appState.quiz.questions.filter(q => 
        q.difficulty === difficulty
    );
    
    // If not enough questions for selected difficulty, include all
    if (allQuestions.length < 10) {
        quizState.questions = shuffleArray([...window.appState.quiz.questions]).slice(0, 10);
    } else {
        quizState.questions = shuffleArray(allQuestions).slice(0, 10);
    }
    
    // Show first question
    showScreen('question');
    displayQuestion();
}

/**
 * Display current question
 */
function displayQuestion() {
    const question = quizState.questions[quizState.currentQuestionIndex];
    
    // Update progress
    document.getElementById('questionCounter').textContent = 
        `Frage ${quizState.currentQuestionIndex + 1}/${quizState.questions.length}`;
    document.getElementById('scoreCounter').textContent = 
        `Punkte: ${quizState.score}`;
    
    // Display question text
    document.getElementById('questionText').textContent = question.question;
    
    // Create answer buttons
    const answersContainer = document.getElementById('answersContainer');
    answersContainer.innerHTML = '';
    
    question.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.textContent = answer;
        button.dataset.index = index;
        button.addEventListener('click', () => selectAnswer(index));
        answersContainer.appendChild(button);
    });
    
    // Hide feedback
    document.getElementById('feedbackContainer').style.display = 'none';
    quizState.answered = false;
}

/**
 * Handle answer selection
 */
function selectAnswer(selectedIndex) {
    if (quizState.answered) return;
    
    quizState.answered = true;
    const question = quizState.questions[quizState.currentQuestionIndex];
    const isCorrect = selectedIndex === question.correct;
    
    // Update score
    if (isCorrect) {
        quizState.score++;
    }
    
    // Update answer buttons
    const answerButtons = document.querySelectorAll('.answer-btn');
    answerButtons.forEach((btn, index) => {
        btn.disabled = true;
        
        if (index === question.correct) {
            btn.classList.add('correct');
        } else if (index === selectedIndex && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // Show feedback
    displayFeedback(isCorrect, question);
}

/**
 * Display feedback for the answer
 */
function displayFeedback(isCorrect, question) {
    const feedbackContainer = document.getElementById('feedbackContainer');
    const feedbackText = document.getElementById('feedbackText');
    
    feedbackContainer.classList.remove('correct', 'incorrect');
    feedbackContainer.classList.add(isCorrect ? 'correct' : 'incorrect');
    
    const emoji = isCorrect ? '✅' : '❌';
    const status = isCorrect ? 'Richtig!' : 'Leider falsch!';
    
    feedbackText.innerHTML = `
        <strong>${emoji} ${status}</strong><br>
        ${question.explanation}
    `;
    
    feedbackContainer.style.display = 'block';
    
    // Update score display
    document.getElementById('scoreCounter').textContent = 
        `Punkte: ${quizState.score}`;
}

/**
 * Move to next question or show results
 */
function nextQuestion() {
    quizState.currentQuestionIndex++;
    
    if (quizState.currentQuestionIndex < quizState.questions.length) {
        displayQuestion();
    } else {
        showResults();
    }
}

/**
 * Show quiz results
 */
function showResults() {
    const totalQuestions = quizState.questions.length;
    const percentage = Math.round((quizState.score / totalQuestions) * 100);
    
    // Update results display
    document.getElementById('finalScore').textContent = quizState.score;
    document.getElementById('totalQuestions').textContent = totalQuestions;
    
    // Determine result message based on score
    let message = '';
    let emoji = '';
    
    if (percentage >= 90) {
        emoji = '🏆';
        message = 'Hervorragend! Du bist ein wahrer Regelexperte!';
    } else if (percentage >= 75) {
        emoji = '🎉';
        message = 'Sehr gut! Du kennst dich bestens aus!';
    } else if (percentage >= 60) {
        emoji = '👍';
        message = 'Gut gemacht! Du hast solide Regelkenntnisse!';
    } else if (percentage >= 50) {
        emoji = '📚';
        message = 'Nicht schlecht! Mit etwas Übung wirst du besser!';
    } else {
        emoji = '💪';
        message = 'Weiter üben! Lies die Regeln nochmal durch!';
    }
    
    document.getElementById('resultMessage').textContent = `${emoji} ${message}`;
    
    // Save quiz statistics
    saveQuizStatistics();
    
    showScreen('results');
}

/**
 * Show specific quiz screen
 */
function showScreen(screen) {
    quizStartScreen.style.display = 'none';
    quizQuestionScreen.style.display = 'none';
    quizResultsScreen.style.display = 'none';
    
    switch(screen) {
        case 'start':
            quizStartScreen.style.display = 'block';
            break;
        case 'question':
            quizQuestionScreen.style.display = 'block';
            break;
        case 'results':
            quizResultsScreen.style.display = 'block';
            break;
    }
}

/**
 * Reset quiz state
 */
function resetQuizState() {
    quizState.difficulty = null;
    quizState.questions = [];
    quizState.currentQuestionIndex = 0;
    quizState.score = 0;
    quizState.answered = false;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Get quiz statistics from localStorage
 */
function getQuizStatistics() {
    const stats = localStorage.getItem('quizStats');
    return stats ? JSON.parse(stats) : {
        totalGames: 0,
        totalScore: 0,
        bestScore: 0,
        byDifficulty: {
            easy: { games: 0, totalScore: 0 },
            medium: { games: 0, totalScore: 0 },
            hard: { games: 0, totalScore: 0 }
        }
    };
}

/**
 * Save quiz statistics to localStorage
 */
function saveQuizStatistics() {
    const stats = getQuizStatistics();
    
    stats.totalGames++;
    stats.totalScore += quizState.score;
    stats.bestScore = Math.max(stats.bestScore, quizState.score);
    
    if (quizState.difficulty) {
        const diffStats = stats.byDifficulty[quizState.difficulty];
        diffStats.games++;
        diffStats.totalScore += quizState.score;
    }
    
    localStorage.setItem('quizStats', JSON.stringify(stats));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuiz);
} else {
    initQuiz();
}

// Export for use in other modules
window.quizState = quizState;
window.startQuiz = startQuiz;
