export async function parseTextFile(file: File): Promise<string> {
  return await file.text();
}
