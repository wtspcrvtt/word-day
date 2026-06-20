import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Сервер Word Day работает. Используйте POST /api/check-word');
});

app.post('/api/check-word', async (req, res) => {
  const { word, sentence } = req.body;

  if (!sentence || sentence.split(/\s+/).filter(w => w.length > 0).length < 3) {
    return res.status(400).json({ error: 'Слишком короткое предложение' });
  }

  try {
    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${process.env.YANDEX_API_KEY}`,
        'x-folder-id': process.env.YANDEX_FOLDER_ID,
      },
      body: JSON.stringify({
        modelUri: `gpt://${process.env.YANDEX_FOLDER_ID}/yandexgpt-lite`,
        completionOptions: {
          stream: false,
          temperature: 0.6,
          maxTokens: 150,
        },
        messages: [
          {
            role: 'system',
            text: `Ты — строгий, но добрый преподаватель русского языка. Оцени предложение пользователя со словом "${word}" по трём критериям: 1) смысловая точность (правильно ли использовано слово), 2) грамматика, 3) оригинальность. Не ставь выше 7, если предложение шаблонное. 9–10 ставь только за красивые и нестандартные фразы. Ответь строго в формате JSON: {"score": число от 1 до 10, "feedback": "короткий совет или похвала (до 30 слов)", "example": "твой пример идеального предложения"}.`
          },
          {
            role: 'user',
            text: `Предложение: "${sentence}"`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('YandexGPT error:', errorData);
      throw new Error('Ошибка YandexGPT');
    }

    const data = await response.json();
    const resultText = data.result.alternatives[0].message.text;
    
    

    let cleaned = resultText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/\n/g, ' ')
        .trim();


    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    let parsed;

    if (jsonMatch) {
        try {
            parsed = JSON.parse(jsonMatch[0]);
        } catch (e) {
            parsed = null;
        }
    }

    if (!parsed) {
        const scoreMatch = cleaned.match(/\b([1-9]|10)\b/);
        const score = scoreMatch ? parseInt(scoreMatch[0]) : 5;
        parsed = {
            score: score,
            feedback: cleaned.replace(/\d+/g, '').trim() || 'Хорошее предложение!',
            example: `Попробуй использовать слово "${word}" в более интересном контексте.`
        };
    }

        res.json(parsed);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Не удалось обработать запрос' });
    }
    });

    app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    });