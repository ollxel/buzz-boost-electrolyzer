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
const bot = new TelegramBot(TOKEN, { polling: false });

bot.setWebHook(`${APP_URL}/webhook`);
console.log(`✅ Webhook установлен: ${APP_URL}/webhook`);

// --- Handlers ---
bot.onText(/\/start/, (msg) => {
  const firstName = msg.from.first_name || 'пользователь';
  
  // Отправляем информацию о команде
  bot.sendMessage(msg.chat.id, 
    `Привет, ${firstName}! 👋\n\n` +
    '👨‍🔬 Мы команда, которая исследует электролиз воды, мембраны и катализаторы для повышения выхода водорода.'
  );
  
  // Отправляем информацию о видео
  bot.sendMessage(msg.chat.id, '🎥 Видео пока нет. Тут появится ссылка позже!');
});

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