import * as SQLite from "expo-sqlite";
import { initialState, State, withDefaults } from "./domain";
let database: Promise<SQLite.SQLiteDatabase> | undefined;
async function db() {
  database ??= (async () => {
    const value = await SQLite.openDatabaseAsync("questly.db");
    await value.execAsync(
      "PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL); PRAGMA user_version = 1;",
    );
    return value;
  })();
  return database;
}
export async function loadState(): Promise<State> {
  const row = await (
    await db()
  ).getFirstAsync<{ payload: string }>(
    "SELECT payload FROM app_state WHERE id = 1",
  );
  return row ? withDefaults(JSON.parse(row.payload)) : initialState();
}
export async function saveState(state: State) {
  await (
    await db()
  ).runAsync(
    "INSERT INTO app_state (id, payload) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload",
    JSON.stringify(state),
  );
}
