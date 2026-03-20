import logging
from aiogram import Bot, Dispatcher, types
from aiogram.contrib.middlewares.logging import LoggingMiddleware
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
import os

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Замените на ваш токен от @BotFather
BOT_TOKEN = os.getenv('BOT_TOKEN', 'ВАШ_ТОКЕН_БОТА')
# Замените на ваш GitHub Pages URL после публикации
GAME_URL = os.getenv('GAME_URL', 'https://ВАШ_АККАУНТ.github.io/tg-guess-game/frontend/')

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher(bot)
dp.middleware.setup(LoggingMiddleware())

@dp.message_handler(commands=['start'])
async def start_command(message: types.Message):
    """Обработчик команды /start"""
    # Создаем кнопку для запуска игры
    keyboard = InlineKeyboardMarkup(row_width=1)
    game_button = InlineKeyboardButton(
        text="🎮 Начать игру 'Угадай число'", 
        web_app=types.WebAppInfo(url=GAME_URL)
    )
    keyboard.add(game_button)
    
    await message.reply(
        "Привет! Давай сыграем в игру 'Угадай число'.\n"
        "Правила простые: я загадываю число от 1 до 100, а ты пытаешься угадать.\n"
        "У тебя есть 7 попыток. Нажимай кнопку ниже, чтобы начать!",
        reply_markup=keyboard
    )

@dp.message_handler()
async def echo_message(message: types.Message):
    """Обработчик всех остальных сообщений"""
    keyboard = InlineKeyboardMarkup(row_width=1)
    game_button = InlineKeyboardButton(
        text="🎮 Играть в 'Угадай число'", 
        web_app=types.WebAppInfo(url=GAME_URL)
    )
    keyboard.add(game_button)
    
    await message.reply(
        "Нажми на кнопку, чтобы поиграть!",
        reply_markup=keyboard
    )

if __name__ == '__main__':
    from aiogram import executor
    executor.start_polling(dp, skip_updates=True)
