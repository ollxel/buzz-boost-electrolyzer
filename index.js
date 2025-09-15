// index.js
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { MailerSend, SMSParams } from 'mailersend';

const TOKEN = process.env.BOT_TOKEN;
const HOSTNAME = process.env.RENDER_EXTERNAL_HOSTNAME;
const PORT = process.env.PORT || 10000;
const TARGET_PHONE = '+79935432386'; // Целевой телефон для SMS
const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY; // Ключ API MailerSend
const SMS_FROM = process.env.SMS_FROM; // Номер телефона MailerSend

if (!TOKEN) {
  throw new Error('❌ Укажи BOT_TOKEN в настройках Render Environment');
}

if (!MAILERSEND_API_KEY || !SMS_FROM) {
  throw new Error('❌ Укажи MAILERSEND_API_KEY и SMS_FROM в настройках Render Environment');
}

const APP_URL = `https://${HOSTNAME}`;
const app = express();

const bot = new TelegramBot(TOKEN, { polling: false });
const mailerSend = new MailerSend({
  apiKey: MAILERSEND_API_KEY,
});
const userStates = {};

bot.setWebHook(`${APP_URL}/webhook`);
console.log(`✅ Webhook установлен: ${APP_URL}/webhook`);

// Функция отправки SMS
async function sendSMS(phoneNumber, message) {
  const smsParams = new SMSParams()
    .setFrom(SMS_FROM)
    .setTo([phoneNumber])
    .setText(message);

  try {
    const response = await mailerSend.sms.send(smsParams);
    console.log('✅ SMS отправлено успешно:', response);
    return true;
  } catch (error) {
    console.error('❌ Ошибка отправки SMS:', error.response?.data || error.message || error);
    return false;
  }
}

// --- Handlers ---
bot.onText(/\/start/, (msg) => {
  const firstName = msg.from.first_name || 'пользователь';
  bot.sendMessage(msg.chat.id, `Привет, ${firstName}! 👋\nДобро пожаловать!`, mainKeyboard());
});

bot.on('message', async (msg) => {
  if (!msg.text) return;
  
  const chatId = msg.chat.id;
  const text = msg.text;

  if (userStates[chatId] === 'awaiting_question') {
    if (text.toLowerCase() === 'отмена') {
      bot.sendMessage(chatId, 'Вопрос отменён', mainKeyboard());
      delete userStates[chatId];
      return;
    }
    
    const question = `Вопрос от ${msg.from.first_name} (@${msg.from.username || 'без username'}):\n${text}`;
    
    // Отправляем SMS
    const smsSent = await sendSMS(TARGET_PHONE, question);
    
    if (smsSent) {
      bot.sendMessage(chatId, `✅ Ваш вопрос отправлен администратору по SMS!`, mainKeyboard());
    } else {
      bot.sendMessage(chatId, `❌ Произошла ошибка при отправке вопроса. Попробуйте позже.`, mainKeyboard());
    }
    
    delete userStates[chatId];
    return;
  }

  if (text === 'О нас') {
    bot.sendMessage(chatId, '👨‍🔬 Мы команда, которая исследует электролиз воды, мембраны и катализаторы для повышения выхода водорода.');
  } else if (text === 'Видео') {
    bot.sendMessage(chatId, '🎥 Видео пока нет. Тут появится ссылка позже!');
  } else if (text === 'Вопросы') {
    userStates[chatId] = 'awaiting_question';
    bot.sendMessage(chatId, 'Введите ваш вопрос (или напишите "отмена" для отмены):', {
      reply_markup: { remove_keyboard: true }
    });
  } else if (text === 'Участники') {
    bot.sendMessage(chatId, 'Здесь будет список участников');
  }
});

function mainKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        ['О нас', 'Видео'],
        ['Вопросы', 'Участники']
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