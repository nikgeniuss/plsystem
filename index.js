// ========== НАСТРОЙКИ ==========
const SITE_URL = 'https://nikgeniuss.github.io/test/';
const GITHUB_TOKEN = 'ВАШ_GITHUB_TOKEN'; // Нужно создать!
const REPO_OWNER = 'nikgeniuss'; // Ваш логин GitHub
const REPO_NAME = 'plsystem'; // Ваш репозиторий
const FILE_PATH = 'users.json'; // Файл для хранения данных

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Вебхук от Telegram
    if (request.method === 'POST' && url.pathname === '/webhook') {
      try {
        const update = await request.json();
        return await handleUpdate(update, env, ctx);
      } catch (error) {
        console.error('❌ Ошибка вебхука:', error);
        return new Response('Error', { status: 400 });
      }
    }
    
    // Статусная страница
    return new Response(
      '🤖 Telegram Bot for Testex is running!\n\n' +
      '📊 Данные сохраняются в GitHub\n' +
      '📁 Файл: users.json\n' +
      `🌐 Сайт: ${SITE_URL}`,
      { 
        headers: { 'Content-Type': 'text/plain; charset=utf-8' } 
      }
    );
  }
};

// ========== ОБРАБОТКА СООБЩЕНИЙ ==========
async function handleUpdate(update, env, ctx) {
  if (!update.message || !update.message.text) {
    return new Response('OK');
  }
  
  const BOT_TOKEN = env.BOT_TOKEN;
  const { message } = update;
  const chatId = message.chat.id;
  const user = message.from;
  
  console.log(`📨 /start от ${user.id} (@${user.username})`);
  
  // Команда /start
  if (message.text.startsWith('/start')) {
    // 1. Сохраняем в GitHub
    const saved = await saveToGitHub(user);
    
    // 2. Отправляем ответ в Telegram
    ctx.waitUntil(sendTelegramResponse(BOT_TOKEN, chatId, user, saved));
  }
  
  return new Response('OK');
}

// ========== СОХРАНЕНИЕ В GITHUB ==========
async function saveToGitHub(user) {
  try {
    // 1. Получаем текущий файл
    const currentContent = await getGitHubFile();
    let users = [];
    
    if (currentContent) {
      users = JSON.parse(currentContent);
    }
    
    // 2. Добавляем нового пользователя
    const newUser = {
      id: user.id,
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      auth_date: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    // Проверяем, есть ли уже такой ID
    const existingIndex = users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = newUser; // Обновляем
    } else {
      users.push(newUser); // Добавляем нового
    }
    
    // 3. Сохраняем обратно в GitHub
    const saved = await updateGitHubFile(users);
    return saved;
    
  } catch (error) {
    console.error('❌ Ошибка сохранения в GitHub:', error);
    return false;
  }
}

// Получить файл из GitHub
async function getGitHubFile() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    if (response.status === 200) {
      const data = await response.json();
      // Декодируем из base64
      return atob(data.content.replace(/\n/g, ''));
    } else if (response.status === 404) {
      // Файл не существует (первый запуск)
      return null;
    } else {
      console.error(`❌ GitHub API ошибка: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Ошибка получения файла:', error);
    return null;
  }
}

// Обновить файл в GitHub
async function updateGitHubFile(users) {
  try {
    // 1. Получаем текущий SHA (для обновления)
    const getResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    let sha = null;
    if (getResponse.status === 200) {
      const data = await getResponse.json();
      sha = data.sha;
    }
    
    // 2. Кодируем в base64
    const content = JSON.stringify(users, null, 2); // Красивый JSON
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    
    // 3. Отправляем обновление
    const updateResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `👤 Добавлен пользователь ${new Date().toISOString()}`,
          content: encodedContent,
          sha: sha // Если null, создаст новый файл
        })
      }
    );
    
    if (updateResponse.ok) {
      console.log('✅ Данные сохранены в GitHub');
      return true;
    } else {
      const error = await updateResponse.text();
      console.error('❌ GitHub API ошибка:', error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Ошибка обновления файла:', error);
    return false;
  }
}

// ========== ОТПРАВКА В TELEGRAM ==========
async function sendTelegramResponse(botToken, chatId, user, savedSuccess) {
  try {
    const status = savedSuccess ? '✅ Сохранено в GitHub' : '⚠️ Ошибка сохранения';
    
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🎉 *Привет, ${user.first_name || 'друг'}!*\n\n` +
              `✅ Авторизация успешна!\n` +
              `🆔 Ваш ID: \`${user.id}\`\n` +
              `${status}\n` +
              `📁 Файл: ${FILE_PATH}\n\n` +
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
