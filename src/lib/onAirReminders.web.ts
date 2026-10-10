// Web pages can't schedule alerts while closed; the On Air button shows when it's live instead.
export const remindersSupported = false;
export async function remindersEnabled() {
  return false;
}
export async function scheduleOnAirReminders(_ask: boolean): Promise<boolean> {
  return false;
}
