'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Wallet, Percent, Target, Zap,
  Key, Upload, ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// 1. Карточка метрики
export function MetricCard({ title, value, change, icon: Icon }: any) {
  return (
    <div className="card-gradient rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 text-blue-400" />
        <span className={`text-sm font-medium px-2 py-1 rounded-full ${change?.includes('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {change}
        </span>
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-gray-400 text-sm">{title}</p>
    </div>
  );
}

// 2. Форма подключения API
export function APIConnectForm({ onConnect }: { onConnect: (key: string, secret: string) => void }) {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onConnect(apiKey, secretKey);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full card-gradient rounded-3xl p-8 border border-gray-800">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Binance Trader Journal</h1>
          <p className="text-gray-400">Подключите API ключ для анализа ваших сделок</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите ваш API ключ"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Secret Key
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите ваш Secret ключ"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Подключение...' : 'Подключить'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-gray-900/30 rounded-xl border border-gray-800">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Как получить API ключ?</h4>
          <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
            <li>Зайдите в Binance → API Management</li>
            <li>Создайте новый API ключ</li>
            <li>Включите права на чтение (Enable Reading)</li>
            <li>Скопируйте ключи сюда</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// 3. График баланса
export function BalanceChart({ data }: { data: any[] }) {
  return (
    <div className="card-gradient rounded-2xl p-6 border border-gray-800">
      <h3 className="text-lg font-semibold text-white mb-6">Кривая баланса</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              formatter={(v) => [`$${v}`, 'Баланс']}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 4. Таблица сделок
export function TradesTable({ trades }: { trades: any[] }) {
  return (
    <div className="card-gradient rounded-2xl border border-gray-800 overflow-hidden">
      <div className="p-6 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white">Последние сделки</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left p-4 text-gray-400 font-medium">Пара</th>
              <th className="text-left p-4 text-gray-400 font-medium">Сторона</th>
              <th className="text-left p-4 text-gray-400 font-medium">Цена</th>
              <th className="text-left p-4 text-gray-400 font-medium">Объем</th>
              <th className="text-left p-4 text-gray-400 font-medium">P&L</th>
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, 10).map((trade) => (
              <tr key={trade.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-4 font-medium text-white">{trade.symbol}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${
                    trade.side === 'BUY' ? 'profit-gradient' : 'loss-gradient'
                  }`}>
                    {trade.side === 'BUY' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {trade.side}
                  </span>
                </td>
                <td className="p-4 text-gray-300">${parseFloat(trade.price).toFixed(2)}</td>
                <td className="p-4 text-gray-300">{parseFloat(trade.qty).toFixed(4)}</td>
                <td className={`p-4 font-medium ${
                  trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trade.pnl >= 0 ? '+' : ''}{trade.pnl}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
