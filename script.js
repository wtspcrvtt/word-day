import words from "./words.js";

const infoBtn = document.getElementById('infoBtn');
const meaningDisplay = document.getElementById('meaningDisplay');
const wordDisplay = document.getElementById('wordDisplay');
const partDisplay = document.getElementById('partDisplay');
const sentenceInput = document.getElementById('sentenceInput');
const submitBtn = document.getElementById('submitBtn');


sentenceInput.addEventListener('input', () => {
    const words = sentenceInput.value.trim().split(/\s+/).filter(w => w.length > 0);
    submitBtn.disabled = words.length < 3;
});

infoBtn.addEventListener('click', () => {
    meaningDisplay.classList.toggle('visible');
    infoBtn.classList.toggle('active');
});

function getCurrentWordIndex() {
  let index = localStorage.getItem('wordIndex');
  if (index === null) {
    index = 0;
    localStorage.setItem('wordIndex', index);
  }
  return parseInt(index);
}

function setWordIndex(index) {
  localStorage.setItem('wordIndex', index);
}

function getDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

function getCurrentWord() {
  const index = getCurrentWordIndex();
  return words[index % words.length];
}




function renderWord() {
    const currentWord = getCurrentWord();
    wordDisplay.textContent = currentWord.word;
    partDisplay.textContent = currentWord.part;
    meaningDisplay.textContent = currentWord.meaning;
    meaningDisplay.classList.remove('visible');
    document.getElementById('infoBtn').classList.remove('active');
}

renderWord();

function getChallengeDay() {
    const startDateKey = 'wordDayStart';
    let startDate = localStorage.getItem(startDateKey);
    if (!startDate) {
        startDate = new Date().toISOString().slice(0, 10);
        localStorage.setItem(startDateKey, startDate);
    }
    const start = new Date(startDate);
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
}

function renderCounter() {
    const day = getChallengeDay();
    document.getElementById('dayCounter').textContent = `День ${day} из 30`;
}

renderCounter();

submitBtn.addEventListener('click', async () => {
  const text = sentenceInput.value.trim();
  if (text.split(/\s+/).filter(w => w.length > 0).length < 3) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Проверяю...';

  try {
    const response = await fetch('https://word-day.onrender.com/api/check-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        word: wordDisplay.textContent,
        sentence: text
      })
    });

    if (!response.ok) {
      throw new Error('Ошибка сервера');
    }

    const data = await response.json();
    showResult(data);
  } catch (error) {
    console.error(error);
    alert('Не удалось проверить предложение. Попробуй позже');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Проверить';
  }
});

function showResult(data) {
  const resultArea = document.getElementById('resultArea');
  const score = data.score;
  const feedback = data.feedback || 'Отлично!';
  const example = data.example || 'Попробуй написать что-то своё';

  let color = '#FF6B6B';
  if (score >= 7) color = '#FFD93D';
  if (score >= 9) color = '#6BCB77';

  resultArea.innerHTML = `
    <div class="result-card">
      <div class="score" style="color: ${color};">${score}/10</div>
      <p class="feedback">${feedback}</p>
      <p class="example"><strong>Пример:</strong> ${example}</p>
      <button class="save-btn" id="saveResultBtn">Сохранить и продолжить</button>
      <button class="retry-btn" id="retryBtn">Попробовать снова</button>
    </div>
  `;

  document.getElementById('saveResultBtn').addEventListener('click', () => {
    saveRecord(data);
    const currentIndex = getCurrentWordIndex();
    const nextIndex = currentIndex + 1;
    setWordIndex(nextIndex);
    renderWord();
    sentenceInput.value = '';
    submitBtn.disabled = true;
    document.getElementById('resultArea').innerHTML = '';
  });

  document.getElementById('retryBtn').addEventListener('click', () => {
    resultArea.innerHTML = '';
    sentenceInput.value = '';
    submitBtn.disabled = true;
  });
}

function saveRecord(data) {
  const record = {
    date: new Date().toISOString().slice(0, 10),
    word: wordDisplay.textContent,
    userSentence: sentenceInput.value.trim(),
    score: data.score,
    feedback: data.feedback,
    example: data.example
  };

  const records = JSON.parse(localStorage.getItem('wordDayRecords') || '[]');
  records.push(record);
  localStorage.setItem('wordDayRecords', JSON.stringify(records));

  alert('Мы всё сохранили!');
  document.getElementById('resultArea').innerHTML = '';
  sentenceInput.value = '';
  submitBtn.disabled = true;
}

document.getElementById('historyBtn').addEventListener('click', () => {
  document.getElementById('resultArea').style.display = 'none';
  document.getElementById('historyView').style.display = 'block';
  renderHistory();
});

document.getElementById('backToMainBtn').addEventListener('click', () => {
  document.getElementById('historyView').style.display = 'none';
  document.getElementById('resultArea').style.display = 'block';
});

function renderHistory() {
  const container = document.getElementById('historyList');
  const records = JSON.parse(localStorage.getItem('wordDayRecords') || '[]');

  if (records.length === 0) {
    container.innerHTML = '<p class="empty-message">Пока нет записей( Пора написать первое предложение!</p>';
    return;
  }

  container.innerHTML = '';
records.slice().reverse().forEach((record, index) => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <div class="history-header">
        <span class="history-date">${record.date}</span>
        <span class="history-word">${record.word}</span>
        <span class="history-score" style="color: ${getScoreColor(record.score)}">${record.score}/10</span>
      </div>
      <div class="history-details" style="display: none;">
        <p><strong>Предложение:</strong> ${record.userSentence}</p>
        <p><strong>Фидбек:</strong> ${record.feedback}</p>
        <p><strong>Пример:</strong> ${record.example}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      const details = card.querySelector('.history-details');
      details.style.display = details.style.display === 'none' ? 'block' : 'none';
    });
    container.appendChild(card);
  });
}

function getScoreColor(score) {
  if (score >= 9) return '#6BCB77';
  if (score >= 7) return '#FFD93D';
  return '#FF6B6B';
}

document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  if (confirm('Удалить все записи навсегда?')) {
    localStorage.removeItem('wordDayRecords');
    renderHistory();
  }
});

function showView(view) {
  document.getElementById('mainView').style.display = view === 'main' ? 'block' : 'none';
  document.getElementById('historyView').style.display = view === 'history' ? 'block' : 'none';
  document.getElementById('resultArea').style.display = 'block';
}

document.getElementById('historyBtn').addEventListener('click', () => {
  showView('history');
  renderHistory();
});

document.getElementById('backToMainBtn').addEventListener('click', () => {
  showView('main');
});

document.getElementById('statsBtn').addEventListener('click', () => {
  showView('stats');
  renderStats();
});

function renderStats() {
  const container = document.getElementById('statsList');
  const records = JSON.parse(localStorage.getItem('wordDayRecords') || '[]');

  if (records.length === 0) {
    container.innerHTML = '<p class="empty-message">Нет данных для статистики. Напиши первое предложение!</p>';
    return;
  }

  const total = records.length;
  const avgScore = (records.reduce((sum, r) => sum + r.score, 0) / total).toFixed(1);
  const best = Math.max(...records.map(r => r.score));

  container.innerHTML = `
    <div class="stats-summary">
      <div class="stat-item"><span>Всего записей</span> <strong>${total}</strong></div>
      <div class="stat-item"><span>Средний балл</span> <strong>${avgScore}</strong></div>
      <div class="stat-item"><span>Лучший результат</span> <strong>${best}/10</strong></div>
    </div>
    <div class="stats-chart">
      <canvas id="scoreChart" width="400" height="200"></canvas>
    </div>
    <p class="stats-note">График среднего балла по дням</p>
  `;

  drawChart(records);
}

function showView(view) {
  document.getElementById('mainView').style.display = view === 'main' ? 'block' : 'none';
  document.getElementById('historyView').style.display = view === 'history' ? 'block' : 'none';
  document.getElementById('statsView').style.display = view === 'stats' ? 'block' : 'none';
  document.getElementById('resultArea').style.display = 'block';
}

function drawChart(records) {
  const canvas = document.getElementById('scoreChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}