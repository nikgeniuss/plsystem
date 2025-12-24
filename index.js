// ========== НАСТРОЙКИ ==========
const SITE_URL = 'https://nikgeniuss.github.io/test/';
// ↓↓↓ ДОБАВЬТЕ ЭТИ 2 СТРОКИ ↓↓↓
const SUPABASE_URL = 'https://xxihcevqsnatodummbnj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4aWhjZXZxc25hdG9kdW1tYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNTI4OTksImV4cCI6MjA4MTgyODg5OX0.DTNpJUOA6T9vLvhYepODnPLS6L6hz3N7lxYsCAj8P5M';
// ↑↑↑ ДОБАВЬТЕ ЭТИ 2 СТРОКИ ↑↑↑
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 1. Вебхук от Telegram
    if (request.method === 'POST' && url.pathname === '/webhook') {
      try {
        const update = await request.json();
        return await handleUpdate(update, env);
      } catch (error) {
        console.error('Ошибка вебхука:', error);
        return new Response('Error', { status: 400 });
      }
    }
    
    // 2. Статусная страница
    return new Response('🤖 Telegram Bot for Testex is running!', { 
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache'
      } 
    });
  }
};

// Обработчик сообщений Telegram
async function handleUpdate(update, env) {
  if (!update.message || !update.message.text) {
    return new Response('OK');
  }
  
  // Берем токен из переменных окружения Cloudflare
  const BOT_TOKEN = env.BOT_TOKEN || '8328868978:AAHStw9_xFdQHh8_AX9dp8LlIyay7cQodB0';
  const { message } = update;
  const chatId = message.chat.id;
  const user = message.from;
  
  console.log(`📨 Сообщение от ${user.id}: ${message.text}`);
  
  // Команда /start
  if (message.text.startsWith('/start')) {
    // Логируем данные пользователя
    console.log('👤 Данные пользователя:', {
      id: user.id,
      username: user.username || 'не указан',
      first_name: user.first_name || 'не указано',
      last_name: user.last_name || 'не указано',
      time: new Date().toISOString()
    });
    
    // Отправляем ответ в Telegram
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🎉 *Привет, ${user.first_name || 'друг'}!*\n\n✅ Авторизация успешна!\n🆔 Ваш ID: \`${user.id}\`\n\nНажмите кнопку ниже, чтобы вернуться на сайт.`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Вернуться на сайт', url: SITE_URL }
            ]]
          }
        })
      });
      console.log(`✅ Ответ отправлен пользователю ${user.id}`);
    } catch (error) {
      console.error('❌ Ошибка отправки в Telegram:', error);
    }
  }
  
  return new Response('OK');
}
