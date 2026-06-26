import type { DailyBalance } from '../schemas/daily-balance.schema';

export function getTodayDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateDailyBalanceTotals(balance: DailyBalance) {
  const salesTotal = roundMoney(
    balance.salesCash + balance.salesTerminal + balance.salesCard,
  );
  const manualIncomeTotal = roundMoney(
    balance.manualIncomeCash +
      balance.manualIncomeTerminal +
      balance.manualIncomeCard,
  );
  const incomeTotal = roundMoney(salesTotal + manualIncomeTotal);
  const expenseTotal = roundMoney(balance.expenseTotal);
  const netTotal = roundMoney(incomeTotal - expenseTotal);

  return {
    salesCash: roundMoney(balance.salesCash),
    salesTerminal: roundMoney(balance.salesTerminal),
    salesCard: roundMoney(balance.salesCard),
    salesTotal,
    manualIncomeCash: roundMoney(balance.manualIncomeCash),
    manualIncomeTerminal: roundMoney(balance.manualIncomeTerminal),
    manualIncomeCard: roundMoney(balance.manualIncomeCard),
    manualIncomeTotal,
    incomeTotal,
    expenseTotal,
    netTotal,
  };
}
