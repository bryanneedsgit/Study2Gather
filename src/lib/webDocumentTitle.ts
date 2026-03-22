import { Platform } from "react-native";

/** Browser tab title — keep constant (do not mirror active tab / screen name). */
export const WEB_PAGE_TITLE = "Study2Gather";

export function setWebDocumentTitle(): void {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    document.title = WEB_PAGE_TITLE;
  }
}
