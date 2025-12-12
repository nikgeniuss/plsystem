'use client';

import { useState } from 'react';
import { APIConnectForm } from '@/components/ui';
import BinanceAPI from '@/lib/binance';

export default function HomePage() {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async (apiKey: string, secretKey: string) => {
    try {
      // Сохраняем в localStorage (временно, без авторизации)
      localStorage.setItem('binance_api_key', apiKey);
      localStorage.setItem('binance_secret_key', secretKey);
      
      // Тестируем подключение
      const api = new BinanceAPI(apiKey, secretKey);
      await api.getAccountBalance(); // Проверка доступности
      
      setIsConnected(true);
      window.location.href = '/dashboard'; // Редирект на дашборд
    } catch (error) {
      alert('Ошибка подключения. Проверьте ключи и права доступа.');
      console.error(error);
    }
  };

  if (isConnected) {
    return null; // Или лоадер
  }

  return <APIConnectForm onConnect={handleConnect} />;
}
