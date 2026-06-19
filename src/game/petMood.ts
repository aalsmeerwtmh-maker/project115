export type DisplayMood =
  | 'happy'
  | 'normal'
  | 'sad'
  | 'excited'
  | 'sleeping'
  | 'eating'
  | 'walking';

export type TimeGreeting = 'morning' | 'afternoon' | 'evening' | 'night';

// Time schedule (24-hour clock):
//  00–06  sleeping
//  06–07  eating   (breakfast)
//  07–09  walking  (morning exercise)
//  09–12  → pet's actual DB mood
//  12–13  eating   (lunch)
//  13–17  → pet's actual DB mood
//  17–19  walking  (evening exercise)
//  19–21  eating   (dinner)
//  21–24  sleeping
export function getTimeMood(hour: number): 'sleeping' | 'eating' | 'walking' | null {
  if (hour >= 21 || hour < 6) return 'sleeping';
  if (hour === 6 || (hour >= 19 && hour < 21)) return 'eating';
  if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) return 'walking';
  if (hour >= 12 && hour < 13) return 'eating';
  return null;
}

export function resolveDisplayMood(
  petMood: 'happy' | 'normal' | 'sad' | 'excited',
  hour: number,
): DisplayMood {
  return getTimeMood(hour) ?? petMood;
}

export function getTimeGreeting(hour: number): TimeGreeting {
  if (hour >= 21 || hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}
