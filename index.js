// ========== НАСТРОЙКИ ==========
const SITE_URL = 'https://nikgeniuss.github.io/test/';
const SUPABASE_URL = 'https://xxihcevqsnatodummbnj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4aWhjZXZxc25hdG9kdW1tYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNTI4OTksImV4cCI6MjA4MTgyODg5OX0.DTNpJUOA6T9vLvhYepODnPLS6L6hz3N7lxYsCAj8P5M';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 1. Вебхук от Telegram
    if (request.method === 'POST' && url.pathname === '/webhook') {
      try {
        const update = await request.json();
        return await handleUpdate(update, env, ctx);
      } catch (error) {
        console.error('❌ Ошибка вебхука:', error);
        return new Response('Error', { status: 400 });
      }
    }
    
    // 2. Статусная страница
    return new Response(
      '🤖 Telegram Bot for Testex is running!\n\n' +
      '📊 Данные сохраняются в Supabase\n' +
      `🌐 Сайт: ${SITE_URL}\n` +
      `🕐 ${new Date().toISOString()}`,
      { 
        headers: { 
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache'
        } 
      }
    );
  }
};

// ========== ОБРАБОТКА СООБЩЕНИЙ ==========
async function handleUpdate(update, env, ctx) {
  if (!update.message || !update.message.text) {
    return new Response('OK');
  }
  
  // Берем токен из переменных окружения Cloudflare
  const BOT_TOKEN = env.BOT_TOKEN;
  const { message } = update;
  const chatId = message.chat.id;
  const user = message.from;
  
  console.log(`📨 Сообщение от ${user.id}: ${message.text}`);
  
  // Команда /start
  if (message.text.startsWith('/start')) {
    // 1. Сохраняем в Supabase
    const saved = await saveToSupabase(user);
    
    // 2. Отправляем ответ в Telegram
    ctx.waitUntil(sendTelegramResponse(BOT_TOKEN, chatId, user, saved));
  }
  
  return new Response('OK');
}

// ========== СОХРАНЕНИЕ В SUPABASE ==========
async function saveToSupabase(user) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: user.id,
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        auth_date: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      console.log(`✅ Сохранено в Supabase: ${user.id}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ Ошибка Supabase: ${response.status}`, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Ошибка подключения к Supabase:', error);
    return false;
  }
}

// ========== ОТПРАВКА ОТВЕТА В TELEGRAM ==========
async function sendTelegramResponse(botToken, chatId, user, savedSuccess) {
  try {
    const status = savedSuccess ? '✅ Сохранено в базе' : '⚠️ Ошибка сохранения';
    
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🎉 *Привет, ${user.first_name || 'друг'}!*\n\n` +
              `✅ Авторизация успешна!\n` +
              `🆔 Ваш ID: \`${user.id}\`\n` +
              `${status}\n\n` +
              `_Нажмите кнопку ниже:_`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Вернуться на сайт', url: SITE_URL }
          ]]
        }
      })
    });
    
    console.log(`✅ Ответ Telegram отправлен ${user.id}`);
  } catch (error) {
    console.error('❌ Ошибка отправки в Telegram:', error);
  }
}
