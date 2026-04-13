export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: "cash" | "bank" | "ewallet";
  balance: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string;
  type: "income" | "expense";
  amount: string;
  merchant?: string;
  note?: string;
  date: string;
  createdAt: Date;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  name: string;
  qty: number;
  price: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: string;
  month: number;
  year: number;
}

export interface OcrItem {
  name: string;
  qty: number;
  price: number;
}

export interface OcrResult {
  merchant: string | null;
  date: string | null;
  items: OcrItem[];
  total: number | null;
}
