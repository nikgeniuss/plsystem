// ========== НАСТРОЙКИ ==========
const SITE_URL = 'https://nikgeniuss.github.io/test/';
const GITHUB_TOKEN = env.GITHUB_TOKEN; // Токен из Secrets Cloudflare
const REPO_OWNER = 'nikgeniuss';
const REPO_NAME = 'plsystem';
const FILE_PATH = 'users.json';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (request.method === 'POST' && url.pathname === '/webhook') {
      try {
        const update = await request.json();
        return await handleUpdate(update, env, ctx);
      } catch (error) {
        console.error('❌ Ошибка вебхука:', error);
        return new Response('Error', { status: 400 });
      }
    }
    
    return new Response(
      '🤖 Бот работает. Данные в users.json на GitHub\n' +
      `📁 Репозиторий: ${REPO_OWNER}/${REPO_NAME}`,
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }
};

// ========== ОБРАБОТКА СООБЩЕНИЙ ==========
async function handleUpdate(update, env, ctx) {
  if (!update.message || !update.message.text) return new Response('OK');
  
  const BOT_TOKEN = env.BOT_TOKEN;
  const { message } = update;
  const chatId = message.chat.id;
  const user = message.from;
  
  console.log(`📨 /start от ${user.id}`);
  
  if (message.text.startsWith('/start')) {
    const saved = await saveToGitHub(user);
    ctx.waitUntil(sendTelegramResponse(BOT_TOKEN, chatId, user, saved));
  }
  
  return new Response('OK');
}

// ========== СОХРАНЕНИЕ В GITHUB ==========
async function saveToGitHub(user) {
  try {
    // 1. Получаем или создаём файл
    const { content, sha } = await getOrCreateFile();
    let users = content ? JSON.parse(content) : [];
    
    // 2. Добавляем/обновляем пользователя
    const newUser = {
      id: user.id,
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      auth_date: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    const existingIndex = users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = newUser;
    } else {
      users.push(newUser);
    }
    
    // 3. Сохраняем обратно
    return await updateFile(users, sha);
    
  } catch (error) {
    console.error('❌ Ошибка GitHub:', error);
    return false;
  }
}

// ========== РАБОТА С ФАЙЛАМИ GITHUB ==========
async function getOrCreateFile() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Telegram-Bot'
        }
      }
    );
    
    if (response.status === 200) {
      const data = await response.json();
      const content = atob(data.content.replace(/\n/g, ''));
      return { content, sha: data.sha };
    }
    
    // Файла нет - возвращаем пустой результат
    if (response.status === 404) {
      console.log('📄 Файла нет, будет создан при первом сохранении');
      return { content: null, sha: null };
    }
    
    console.error(`❌ GitHub API: ${response.status}`);
    return { content: null, sha: null };
    
  } catch (error) {
    console.error('❌ Ошибка запроса:', error);
    return { content: null, sha: null };
  }
}

async function updateFile(users, sha) {
  try {
    // Форматируем JSON
    const content = JSON.stringify(users, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Telegram-Bot'
        },
        body: JSON.stringify({
          message: `🤖 Добавлен пользователь ${new Date().toISOString().slice(0, 10)}`,
          content: encodedContent,
          sha: sha // Если null - создаст новый файл
        })
      }
    );
    
    if (response.ok) {
      console.log('✅ Файл сохранён в GitHub');
      return true;
    } else {
      const error = await response.text();
      console.error('❌ GitHub ошибка:', error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Ошибка сохранения:', error);
    return false;
  }
}

// ========== ОТПРАВКА В TELEGRAM ==========
async function sendTelegramResponse(botToken, chatId, user, savedSuccess) {
  try {
    const status = savedSuccess ? '✅ Данные в GitHub' : '⚠️ Ошибка GitHub';
    const repoUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/main/${FILE_PATH}`;
    
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🎉 *Привет, ${user.first_name || 'друг'}!*\n\n` +
              `✅ Авторизация успешна!\n` +
              `🆔 ID: \`${user.id}\`\n` +
              `${status}\n` +
              `📁 ${repoUrl}\n\n` +
              `_Нажмите кнопку ниже:_`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Вернуться на сайт', url: SITE_URL },
            { text: '📂 Посмотреть данные', url: repoUrl }
          ]]
        }
      })
    });
    
    console.log(`✅ Ответ отправлен ${user.id}`);
  } catch (error) {
    console.error('❌ Ошибка Telegram:', error);
  }
}
