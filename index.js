// ========== НАСТРОЙКИ ==========
const SITE_URL = 'https://nikgeniuss.github.io/test/';
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
      '🤖 Telegram Bot for Testex\n' +
      '📁 Данные в GitHub: ' + REPO_OWNER + '/' + REPO_NAME + '/' + FILE_PATH,
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
  
  console.log(`📨 /start от ${user.id} (@${user.username || 'нет'})`);
  
  if (message.text.startsWith('/start')) {
    const saved = await saveToGitHub(user, env);
    ctx.waitUntil(sendTelegramResponse(BOT_TOKEN, chatId, user, saved));
  }
  
  return new Response('OK');
}

// ========== СОХРАНЕНИЕ В GITHUB ==========
async function saveToGitHub(user, env) {
  try {
    // 1. Получаем токен из env
    const GITHUB_TOKEN = env.GITHUB_TOKEN;
    
    // ВРЕМЕННАЯ ОТЛАДКА: выводим первые 5 символов токена для проверки
    console.log('🔐 Токен из env (первые 5 символов):', GITHUB_TOKEN ? GITHUB_TOKEN.substring(0, 5) + '...' : 'ТОКЕН ОТСУТСТВУЕТ!');
    console.log('🔐 Полная длина токена:', GITHUB_TOKEN ? GITHUB_TOKEN.length : '0');
    
    // 2. Проверяем, что токен вообще есть
    if (!GITHUB_TOKEN) {
      console.error('❌ FATAL: GITHUB_TOKEN не определён в env');
      return false;
    }
    
    // 3. ПРЯМАЯ ПРОВЕРКА API С ЭТИМ ТОКЕНОМ
    console.log('🔄 Тестирую GitHub API напрямую...');
    const testResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Telegram-Bot-1.0'
        }
      }
    );
    
    console.log(`📡 GitHub API тест: статус ${testResponse.status} ${testResponse.statusText}`);
    
    if (testResponse.status === 401 || testResponse.status === 403) {
      const errorText = await testResponse.text();
      console.error('❌ GitHub API тест провален (ошибка доступа):', errorText.slice(0, 200));
      return false;
    }
    
    // 4. Получаем или создаём файл
    const { content, sha } = await getOrCreateFile(GITHUB_TOKEN);
    
    // Безопасный парсинг JSON
    let users = [];
    if (content && content.trim() !== '') {
      try {
        users = JSON.parse(content);
        console.log(`📊 Загружено ${users.length} пользователей из файла`);
      } catch (parseError) {
        console.error('❌ Ошибка парсинга JSON:', parseError.message);
        // Если файл битый, начинаем с пустого массива
        users = [];
      }
    } else {
      console.log('📄 Файл пустой или отсутствует, начинаем новый массив');
    }
    
    // 5. Добавляем/обновляем пользователя
    const newUser = {
      id: user.id,
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      auth_date: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    // Убираем дубликаты
    users = users.filter(u => u.id !== user.id);
    users.push(newUser);
    
    // 6. Сохраняем
    return await updateFile(users, sha, GITHUB_TOKEN);
    
  } catch (error) {
    console.error('❌ Ошибка GitHub:', error.message);
    return false;
  }
}

// ========== РАБОТА С ФАЙЛАМИ GITHUB ==========
async function getOrCreateFile(GITHUB_TOKEN) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Telegram-Bot-1.0'
        }
      }
    );
    
    if (response.status === 200) {
      const data = await response.json();
      // Безопасное декодирование
      const fileContent = data.content.replace(/\n/g, '');
      try {
        const content = atob(fileContent);
        return { content, sha: data.sha };
      } catch (decodeError) {
        console.error('❌ Ошибка декодирования base64:', decodeError.message);
        // Если файл пустой или битый, считаем его новым
        return { content: null, sha: null };
      }
    }
    
    if (response.status === 404) {
      console.log('📄 Файла users.json нет, будет создан');
      return { content: null, sha: null };
    }
    
    // Любая другая ошибка от GitHub
    console.error(`❌ GitHub getFile: ${response.status}`, await response.text());
    return { content: null, sha: null };
    
  } catch (error) {
    console.error('❌ Ошибка запроса getFile:', error.message);
    return { content: null, sha: null };
  }
}

async function updateFile(users, sha, GITHUB_TOKEN) {
  try {
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
          'User-Agent': 'Telegram-Bot-1.0'
        },
        body: JSON.stringify({
          message: `🤖 Добавлен ${users.length} пользователь [${new Date().toISOString().slice(0, 10)}]`,
          content: encodedContent,
          sha: sha
        })
      }
    );
    
    if (response.ok) {
      console.log(`✅ Сохранено в GitHub (${users.length} пользователей)`);
      return true;
    } else {
      const error = await response.text();
      console.error('❌ GitHub API updateFile:', error.slice(0, 200));
      return false;
    }
    
  } catch (error) {
    console.error('❌ Ошибка сохранения updateFile:', error.message);
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
              `🆔 Ваш ID: \`${user.id}\`\n` +
              `👤 Имя: ${user.first_name || 'не указано'}\n` +
              `📱 @${user.username || 'без username'}\n\n` +
              `${status}\n` +
              `📁 Файл: users.json\n\n` +
              `_Нажмите кнопку ниже:_`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Вернуться на сайт', url: SITE_URL }
          ]]
        }
      })
    });
    
    console.log(`✅ Ответ Telegram отправлен`);
  } catch (error) {
    console.error('❌ Ошибка Telegram:', error.message);
  }
}
