let secretNumber;
let attempts;
const maxAttempts = 7;

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand(); // Разворачиваем на весь экран

function newGame() {
    secretNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    document.getElementById('attempt').textContent = attempts;
    document.getElementById('hint').textContent = 'Введите число от 1 до 100';
    document.getElementById('message').textContent = '';
    document.getElementById('guessInput').value = '';
    document.getElementById('guessInput').disabled = false;
    console.log('Загадано:', secretNumber); // Для теста
}

function checkGuess() {
    const guess = parseInt(document.getElementById('guessInput').value);
    
    if (isNaN(guess) || guess < 1 || guess > 100) {
        showMessage('❌ Введите число от 1 до 100!', 'error');
        return;
    }
    
    attempts++;
    document.getElementById('attempt').textContent = attempts;
    
    if (guess === secretNumber) {
        showMessage('🎉 Поздравляю! Вы угадали число!', 'success');
        document.getElementById('guessInput').disabled = true;
        tg.HapticFeedback.notificationSuccess(); // Вибрация в Telegram
    } else if (attempts >= maxAttempts) {
        showMessage(`😢 Игра окончена! Число было: ${secretNumber}`, 'error');
        document.getElementById('guessInput').disabled = true;
        tg.HapticFeedback.notificationError();
    } else if (guess < secretNumber) {
        showMessage('📈 Загаданное число БОЛЬШЕ', 'hint');
        tg.HapticFeedback.impactOccurred('light');
    } else {
        showMessage('📉 Загаданное число МЕНЬШЕ', 'hint');
        tg.HapticFeedback.impactOccurred('light');
    }
    
    document.getElementById('guessInput').value = '';
}

function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    
    if (type === 'success') {
        messageEl.style.color = '#4CAF50';
    } else if (type === 'error') {
        messageEl.style.color = '#f44336';
    } else {
        messageEl.style.color = 'var(--tg-theme-hint-color, #666)';
    }
}

// Начинаем новую игру при загрузке
newGame();
