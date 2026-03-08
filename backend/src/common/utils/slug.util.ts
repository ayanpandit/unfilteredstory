export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateUniqueSlug(text: string): string {
  const baseSlug = generateSlug(text);
  const uniqueSuffix = Date.now().toString(36);
  return `${baseSlug}-${uniqueSuffix}`;
}
