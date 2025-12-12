import axios from 'axios';
import crypto from 'crypto-js';

// Типы данных
export interface Trade {
  id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  commission: string;
  isBuyer: boolean;
  isMaker: boolean;
}

export interface Balance {
  asset: string;
  free: string;
  locked: string;
}

export interface Position {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
}

class BinanceAPI {
  private apiKey: string;
  private apiSecret: string;
  private baseURL = 'https://api.binance.com';

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  // Подпись запроса
  private signQuery(query: string): string {
    return crypto.HmacSHA256(query, this.apiSecret).toString();
  }

  // Получить все сделки (spot)
  async getSpotTrades(symbol?: string): Promise<Trade[]> {
    const timestamp = Date.now();
    let query = `timestamp=${timestamp}`;
    
    if (symbol) {
      query += `&symbol=${symbol}`;
    }
    
    const signature = this.signQuery(query);
    const url = `${this.baseURL}/api/v3/myTrades?${query}&signature=${signature}`;
    
    const response = await axios.get(url, {
      headers: { 'X-MBX-APIKEY': this.apiKey }
    });
    
    return response.data;
  }

  // Получить баланс
  async getAccountBalance(): Promise<Balance[]> {
    const timestamp = Date.now();
    const query = `timestamp=${timestamp}`;
    const signature = this.signQuery(query);
    
    const url = `${this.baseURL}/api/v3/account?${query}&signature=${signature}`;
    
    const response = await axios.get(url, {
      headers: { 'X-MBX-APIKEY': this.apiKey }
    });
    
    return response.data.balances.filter((b: Balance) => 
      parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
    );
  }

  // Получить фьючерсные позиции
  async getFuturesPositions(): Promise<Position[]> {
    const timestamp = Date.now();
    const query = `timestamp=${timestamp}`;
    const signature = this.signQuery(query);
    
    const url = `https://fapi.binance.com/fapi/v2/positionRisk?${query}&signature=${signature}`;
    
    const response = await axios.get(url, {
      headers: { 'X-MBX-APIKEY': this.apiKey }
    });
    
    return response.data.filter((p: Position) => parseFloat(p.positionAmt) !== 0);
  }

  // Рассчитать статистику
  calculateStats(trades: Trade[]) {
    let totalProfit = 0;
    let totalTrades = trades.length;
    let winningTrades = 0;
    let totalWins = 0;
    let totalLosses = 0;
    
    trades.forEach(trade => {
      const pnl = parseFloat(trade.quoteQty) * (trade.isBuyer ? -1 : 1);
      totalProfit += pnl;
      
      if (pnl > 0) {
        winningTrades++;
        totalWins += pnl;
      } else {
        totalLosses += Math.abs(pnl);
      }
    });
    
    return {
      totalProfit,
      totalTrades,
      winRate: (winningTrades / totalTrades * 100).toFixed(1),
      profitFactor: totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : '∞',
      avgWin: winningTrades > 0 ? (totalWins / winningTrades).toFixed(2) : '0',
      avgLoss: (totalTrades - winningTrades) > 0 ? 
        (totalLosses / (totalTrades - winningTrades)).toFixed(2) : '0',
    };
  }
}

export default BinanceAPI;
