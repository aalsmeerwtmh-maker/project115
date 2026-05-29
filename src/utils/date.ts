// Date utilities used throughout the app.
// The steps table uses YYYY-MM-DD strings as its primary key (one row per day).

// Returns the date as 'YYYY-MM-DD' in UTC. Defaults to today.
export function toDateString(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

// Returns the current time as unix milliseconds — used for created_at / updated_at columns.
export function nowMs(): number {
  return Date.now();
}
