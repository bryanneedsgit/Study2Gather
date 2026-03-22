/**
 * iOS/Android use `expo-camera` in `CheckInScreen`. Metro resolves `WebQrScanner.web.tsx` on web only.
 */
export function WebQrScanner(_props: {
  onScan: (data: string) => void;
  paused: boolean;
}): null {
  return null;
}

export function WebManualCheckInInput(_props: {
  onSubmit: (value: string) => void;
  disabled?: boolean;
}): null {
  return null;
}
