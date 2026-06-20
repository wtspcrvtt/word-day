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
