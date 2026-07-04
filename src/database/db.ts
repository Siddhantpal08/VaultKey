import * as SQLite from "expo-sqlite";
import { triggerAutoBackup } from "./backup";

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
  favourite: number; // 0 | 1
  is_note: number; // 0 | 1
  deleted_at: string | null;
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
        favourite INTEGER NOT NULL DEFAULT 0,
        is_note INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
    `,
    [],
  );

  // Idempotent migration: add favourite column to existing databases.
  try {
    await db.runAsync(`ALTER TABLE vaults ADD COLUMN favourite INTEGER NOT NULL DEFAULT 0;`, []);
  } catch {}
  try {
    await db.runAsync(`ALTER TABLE vaults ADD COLUMN is_note INTEGER NOT NULL DEFAULT 0;`, []);
  } catch {}
  try {
    await db.runAsync(`ALTER TABLE vaults ADD COLUMN deleted_at TEXT;`, []);
  } catch {}

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

  await db.runAsync(
    `
      CREATE INDEX IF NOT EXISTS idx_vaults_favourite
      ON vaults(favourite);
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
        favourite,
        is_note,
        deleted_at,
        created_at,
        updated_at
      FROM vaults
      WHERE is_note = 0 AND deleted_at IS NULL
      ORDER BY updated_at DESC;
    `,
    [],
  );
}

export async function getNotes(): Promise<VaultRow[]> {
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
        favourite,
        is_note,
        deleted_at,
        created_at,
        updated_at
      FROM vaults
      WHERE is_note = 1 AND deleted_at IS NULL
      ORDER BY updated_at DESC;
    `,
    [],
  );
}

export async function getFavourites(): Promise<VaultRow[]> {
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
        favourite,
        is_note,
        deleted_at,
        created_at,
        updated_at
      FROM vaults
      WHERE favourite = 1 AND deleted_at IS NULL
      ORDER BY site_name ASC;
    `,
    [],
  );
}

export async function toggleFavourite(id: number, value: 0 | 1): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE vaults SET favourite = ? WHERE id = ?;`, [value, id]);
  void triggerAutoBackup();
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
  isNote?: number; // 0 or 1
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
        is_note,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
      input.isNote ?? 0,
      new Date().toISOString(),
      new Date().toISOString(),
    ],
  );

  void triggerAutoBackup();
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
        favourite,
        is_note,
        deleted_at,
        created_at,
        updated_at
      FROM vaults
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1;
    `,
    [id],
  );

  return row ?? null;
}

/** Store a hashed PIN for the lock screen. Pass null to clear the PIN. */
export async function setPINHash(hashBase64: string | null): Promise<void> {
  if (hashBase64 === null) {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM settings WHERE key = 'pin_hash';`, []);
    return;
  }
  await upsertSetting("pin_hash", hashBase64);
}

/** Retrieve the stored PIN hash, or null if no PIN is set. */
export async function getPINHash(): Promise<string | null> {
  return getSetting("pin_hash");
}

export type UpdateVaultInput = {
  id: number;
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

export async function updateVault(input: UpdateVaultInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `
      UPDATE vaults
      SET
        site_name = ?,
        url = ?,
        username = ?,
        encrypted_password = ?,
        category = ?,
        notes = ?,
        tags = ?,
        strength_score = ?,
        totp_secret = ?,
        updated_at = ?
      WHERE id = ?;
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
      input.id,
    ],
  );
  void triggerAutoBackup();
}

export async function deleteVault(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `
      UPDATE vaults
      SET deleted_at = ?
      WHERE id = ?;
    `,
    [new Date().toISOString(), id],
  );
  void triggerAutoBackup();
}

export async function restoreVault(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `
      UPDATE vaults
      SET deleted_at = NULL
      WHERE id = ?;
    `,
    [id],
  );
  void triggerAutoBackup();
}

export async function hardDeleteVault(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `
      DELETE FROM vaults
      WHERE id = ?;
    `,
    [id],
  );
  void triggerAutoBackup();
}

export async function getDeletedItems(): Promise<VaultRow[]> {
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
        favourite,
        is_note,
        deleted_at,
        created_at,
        updated_at
      FROM vaults
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC;
    `,
    [],
  );
}

export async function clearVaults(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `
      DELETE FROM vaults;
    `,
    [],
  );
  void triggerAutoBackup();
}

export async function clearSettingsExcept(keysToKeep: string[]): Promise<void> {
  const db = await getDatabase();
  if (keysToKeep.length === 0) {
    await db.runAsync(
      `
        DELETE FROM settings;
      `,
      [],
    );
    return;
  }

  const placeholders = keysToKeep.map(() => "?").join(", ");
  await db.runAsync(
    `
      DELETE FROM settings
      WHERE key NOT IN (${placeholders});
    `,
    keysToKeep,
  );
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
