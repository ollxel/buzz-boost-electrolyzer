// index.js
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

const TOKEN = process.env.BOT_TOKEN;
const HOSTNAME = process.env.RENDER_EXTERNAL_HOSTNAME;
const PORT = process.env.PORT || 10000;

if (!TOKEN) {
  throw new Error('❌ Укажи BOT_TOKEN в настройках Render Environment');
}

const APP_URL = `https://${HOSTNAME}`;
const app = express();

// Создаём бота без запуска сервера внутри него
const bot = new TelegramBot(TOKEN, { polling: false });

// Устанавливаем webhook
bot.setWebHook(`${APP_URL}/webhook`);
console.log(`✅ Webhook установлен: ${APP_URL}/webhook`);

// --- Handlers ---
bot.onText(/\/start/, (msg) => {
  const firstName = msg.from.first_name || 'пользователь';
  bot.sendMessage(msg.chat.id, `Привет, ${firstName}! 👋\nДобро пожаловать!`, mainKeyboard());
});

bot.on('message', (msg) => {
  if (msg.text === 'О нас') {
    bot.sendMessage(msg.chat.id, '👨‍🔬 Мы команда, которая исследует электролиз воды, мембраны и катализаторы для повышения выхода водорода.');
  } else if (msg.text === 'Видео') {
    bot.sendMessage(msg.chat.id, '🎥 Видео пока нет. Тут появится ссылка позже!');
  } else if (msg.text === 'Вопросы') {
    bot.sendMessage(msg.chat.id, '❓ Задай свой вопрос — мы пока сохраняем его локально.');
  }
});

function mainKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        ['О нас', 'Видео'],
        ['Вопросы']
      ],
      resize_keyboard: true
    }
  };
}

// --- Express ---
app.use(express.json());

app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/', (req, res) => {
  res.send('Бот работает!');
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
