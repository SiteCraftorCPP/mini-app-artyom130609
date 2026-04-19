import { DEV_MODE } from "../constants/common";

export function showErrorForDevelop(
  name: string,
  error: unknown | undefined,
): void {
  if (DEV_MODE) {
    console.error(name, error);
    return;
  }
}
