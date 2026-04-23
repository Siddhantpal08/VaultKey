import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "vaultkey.db";

export type VaultRow = {
  id: number;
  site_name: string;
  url: string | null;
  username: string;
  encrypted_password: string;
  category: string | null;
  notes: string | null;
  tags: string | null;
  strength_score: number | null;
  totp_secret: string | null;
  created_at: string;
  updated_at: string;
};

export type SettingRow = {
  key: string;
  value: string;
};

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance !== null) {
    return dbInstance;
  }

  dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await dbInstance.execAsync("PRAGMA journal_mode = WAL;");
  await dbInstance.execAsync("PRAGMA foreign_keys = ON;");
  return dbInstance;
}

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `
      CREATE TABLE IF NOT EXISTS vaults (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_name TEXT NOT NULL,
        url TEXT,
        username TEXT NOT NULL,
        encrypted_password TEXT NOT NULL,
        category TEXT,
        notes TEXT,
        tags TEXT,
        strength_score INTEGER,
        totp_secret TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
    `,
    [],
  );

  await db.runAsync(
    `
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `,
    [],
  );

  await db.runAsync(
    `
      CREATE INDEX IF NOT EXISTS idx_vaults_site_name
      ON vaults(site_name);
    `,
    [],
  );

  await db.runAsync(
    `
      CREATE INDEX IF NOT EXISTS idx_vaults_category
      ON vaults(category);
    `,
    [],
  );

  await db.runAsync(
    `
      CREATE INDEX IF NOT EXISTS idx_vaults_updated_at
      ON vaults(updated_at);
    `,
    [],
  );
}

export async function getVaults(): Promise<VaultRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<VaultRow>(
    `
      SELECT
        id,
        site_name,
        url,
        username,
        encrypted_password,
        category,
        notes,
        tags,
        strength_score,
        totp_secret,
        created_at,
        updated_at
      FROM vaults
      ORDER BY updated_at DESC;
    `,
    [],
  );
}

export type CreateVaultInput = {
  siteName: string;
  url: string | null;
  username: string;
  encryptedPassword: string;
  category: string | null;
  notes: string | null;
  tags: string | null;
  strengthScore: number | null;
  totpSecret: string | null;
};

export async function insertVault(input: CreateVaultInput): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `
      INSERT INTO vaults (
        site_name,
        url,
        username,
        encrypted_password,
        category,
        notes,
        tags,
        strength_score,
        totp_secret,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      input.siteName,
      input.url,
      input.username,
      input.encryptedPassword,
      input.category,
      input.notes,
      input.tags,
      input.strengthScore,
      input.totpSecret,
      new Date().toISOString(),
      new Date().toISOString(),
    ],
  );

  return result.lastInsertRowId;
}

export async function getVaultById(id: number): Promise<VaultRow | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<VaultRow>(
    `
      SELECT
        id,
        site_name,
        url,
        username,
        encrypted_password,
        category,
        notes,
        tags,
        strength_score,
        totp_secret,
        created_at,
        updated_at
      FROM vaults
      WHERE id = ?
      LIMIT 1;
    `,
    [id],
  );

  return row ?? null;
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key)
      DO UPDATE SET value = excluded.value;
    `,
    [key, value],
  );
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SettingRow>(
    `
      SELECT key, value
      FROM settings
      WHERE key = ?
      LIMIT 1;
    `,
    [key],
  );

  return row?.value ?? null;
}

export async function getAllSettings(): Promise<SettingRow[]> {
  const db = await getDatabase();
  return db.getAllAsync<SettingRow>(
    `
      SELECT key, value
      FROM settings
      ORDER BY key ASC;
    `,
    [],
  );
}
