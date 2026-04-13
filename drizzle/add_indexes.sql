-- Jalankan sekali di database production/staging
-- Indexes untuk performa query

CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts (user_id);
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories (user_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions (user_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions (date);
CREATE INDEX IF NOT EXISTS transactions_category_id_idx ON transactions (category_id);
CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON transactions (user_id, date);
