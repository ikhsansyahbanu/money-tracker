import {
  pgTable,
  uuid,
  varchar,
  decimal,
  integer,
  timestamp,
  date,
  text,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // cash | bank | ewallet
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // income | expense
  icon: varchar("icon", { length: 10 }),
  color: varchar("color", { length: 7 }),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  accountId: uuid("account_id")
    .references(() => accounts.id)
    .notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  type: varchar("type", { length: 10 }).notNull(), // income | expense
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  merchant: varchar("merchant", { length: 255 }),
  note: text("note"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactionItems = pgTable("transaction_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id")
    .references(() => transactions.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  qty: integer("qty").default(1),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
});

export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  categoryId: uuid("category_id")
    .references(() => categories.id)
    .notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
});
