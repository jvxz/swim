import { appDataDir } from '@tauri-apps/api/path'
import Database from '@tauri-apps/plugin-sql'
import { Kysely } from 'kysely'
import { TauriSqliteDialect } from 'kysely-dialect-tauri'

const db = new Kysely<DB>({
  dialect: new TauriSqliteDialect({
    database: async (prefix) => Database.load(`${prefix}${await appDataDir()}/swim.db`),
  }),
})

export const $db = () => db
