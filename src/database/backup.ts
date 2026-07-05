import { StorageAccessFramework, writeAsStringAsync } from "expo-file-system/legacy";
import { encryptWithSession, hasSessionKey } from "../security/crypto";

const AUTO_BACKUP_URI_KEY = "auto_backup_uri";

export async function requestAutoBackupDirectory(): Promise<string | null> {
  const { upsertSetting } = require("./db");
  const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (permissions.granted) {
    await upsertSetting(AUTO_BACKUP_URI_KEY, permissions.directoryUri);
    return permissions.directoryUri;
  }
  return null;
}

export async function getAutoBackupDirectory(): Promise<string | null> {
  const { getSetting } = require("./db");
  return await getSetting(AUTO_BACKUP_URI_KEY);
}

export async function disableAutoBackup(): Promise<void> {
  const { upsertSetting } = require("./db");
  await upsertSetting(AUTO_BACKUP_URI_KEY, "");
}

export async function triggerAutoBackup(): Promise<boolean> {
  try {
    const dirUri = await getAutoBackupDirectory();
    if (!dirUri) return false;
    if (!hasSessionKey()) return false;

    const db = require("./db");
    const vaultsData = await db.getVaults();
    const notesData = await db.getNotes();
    const allEntries = [...vaultsData, ...notesData];
    const settings = await db.getAllSettings();

    const payload = JSON.stringify({
      schema: "vaultkey-export-v1",
      exportedAt: new Date().toISOString(),
      vaults: allEntries,
      settings,
    });

    const encrypted = encryptWithSession(payload);
    const masterMeta = await db.getSetting("master_password_meta");
    
    // V2 Backup Format: Wraps the encrypted string and includes the crypto salt (master_meta)
    // so the file can be decrypted on a fresh install.
    const v2Export = JSON.stringify({
      version: 2,
      master_meta: masterMeta,
      data: encrypted,
    }, null, 2);

    const fileUriKey = "auto_backup_file_uri";
    const savedFileUri: string | null = await db.getSetting(fileUriKey);

    // Delete all existing auto-backup files in the directory to prevent accumulation
    try {
      const files = await StorageAccessFramework.readDirectoryAsync(dirUri);
      const oldBackups = files.filter(f => f.includes("VaultKey_AutoBackup"));
      for (const oldFile of oldBackups) {
        await StorageAccessFramework.deleteAsync(oldFile);
      }
    } catch (e) {
      console.log("Could not clear old backups:", e);
    }

    // Create a brand-new file and save the URI for future overwrites
    const fileName = "VaultKey_AutoBackup.pnb";
    const newFileUri = await StorageAccessFramework.createFileAsync(
      dirUri,
      fileName,
      "application/octet-stream",
    );
    await writeAsStringAsync(newFileUri, v2Export, { encoding: "utf8" });
    await db.upsertSetting(fileUriKey, newFileUri);
    return true;

  } catch (error) {
    console.error("Auto backup failed:", error);
    return false;
  }
}

