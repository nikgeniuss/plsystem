'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MetricCard, BalanceChart, TradesTable } from '@/components/ui';
import BinanceAPI from '@/lib/binance';
import { TrendingUp, TrendingDown, Wallet, Percent, Target, Zap } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [balance, setBalance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const apiKey = localStorage.getItem('binance_api_key');
      const secretKey = localStorage.getItem('binance_secret_key');
      
      if (!apiKey || !secretKey) {
        router.push('/');
        return;
      }

      const api = new BinanceAPI(apiKey, secretKey);
      
      // Загружаем данные параллельно
      const [spotTrades, accountBalance] = await Promise.all([
        api.getSpotTrades(),
        api.getAccountBalance(),
      ]);

      // Обрабатываем сделки
      const processedTrades = spotTrades.map(trade => ({
        ...trade,
        pnl: calculateTradePNL(trade),
      }));

      setTrades(processedTrades);
      setBalance(accountBalance);
      setStats(api.calculateStats(spotTrades));
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      alert('Ошибка загрузки данных. Проверьте API ключи.');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTradePNL = (trade: any) => {
    // Упрощенный расчет P&L (в реальности сложнее)
    const price = parseFloat(trade.price);
    const qty = parseFloat(trade.qty);
    const commission = parseFloat(trade.commission);
    
    return trade.isBuyer ? -commission : (qty * price * 0.001 - commission);
  };

  // Генерация тестовых данных для графика
  const generateChartData = () => {
    if (!stats) return [];
    
    const data = [];
    let currentBalance = 10000; // Стартовый баланс
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      
      // Симуляция изменений баланса
      currentBalance += (Math.random() - 0.5) * 200;
      if (currentBalance < 5000) currentBalance = 5000;
      
      data.push({
        date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
        balance: Math.round(currentBalance),
      });
    }
    
    return data;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка данных с Binance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      {/* Шапка */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Трейдер Дашборд</h1>
          <p className="text-gray-400">Аналитика ваших сделок на Binance</p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('binance_api_key');
            localStorage.removeItem('binance_secret_key');
            router.push('/');
          }}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
        >
          Сменить ключ
        </button>
      </div>

      {/* Ключевые метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Общая прибыль"
          value={`$${stats?.totalProfit.toFixed(2) || '0'}`}
          change={stats?.totalProfit >= 0 ? '+12.5%' : '-5.2%'}
          icon={TrendingUp}
        />
        <MetricCard
          title="Win Rate"
          value={`${stats?.winRate || '0'}%`}
          change="+3.1%"
          icon={Percent}
        />
        <MetricCard
          title="Profit Factor"
          value={stats?.profitFactor || '0'}
          change="+0.2"
          icon={Target}
        />
        <MetricCard
          title="Всего сделок"
          value={stats?.totalTrades || '0'}
          change={stats?.totalTrades ? `+${Math.floor(stats.totalTrades / 10)}` : '+0'}
          icon={Zap}
        />
      </div>

      {/* График и таблица */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BalanceChart data={generateChartData()} />
        
        {/* Баланс */}
        <div className="card-gradient rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-6">Баланс</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {balance.slice(0, 10).map((item) => (
              <div key={item.asset} className="flex justify-between items-center p-3 hover:bg-gray-800/30 rounded-lg">
                <span className="font-medium text-white">{item.asset}</span>
                <span className="text-gray-300">
                  {parseFloat(item.free).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 8
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Таблица сделок */}
      <TradesTable trades={trades} />

      {/* Статистика внизу */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="card-gradient rounded-2xl p-6 border border-gray-800">
          <h4 className="font-medium text-white mb-4">Средняя прибыль</h4>
          <p className="text-2xl font-bold text-green-400">${stats?.avgWin || '0'}</p>
        </div>
        <div className="card-gradient rounded-2xl p-6 border border-gray-800">
          <h4 className="font-medium text-white mb-4">Средний убыток</h4>
          <p className="text-2xl font-bold text-red-400">${stats?.avgLoss || '0'}</p>
        </div>
        <div className="card-gradient rounded-2xl p-6 border border-gray-800">
          <h4 className="font-medium text-white mb-4">Активных пар</h4>
          <p className="text-2xl font-bold text-blue-400">
            {new Set(trades.map(t => t.symbol)).size}
          </p>
        </div>
      </div>
    </div>
  );
}
