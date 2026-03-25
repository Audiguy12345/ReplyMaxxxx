export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function safeCopy(text: string) {
  return navigator.clipboard.writeText(text);
}
