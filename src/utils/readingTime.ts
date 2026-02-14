const WORDS_PER_MINUTE = 200;

export function getReadingTime(content: string): number {
  const text = content.replace(/```[\s\S]*?```/g, '').replace(/[#*>\-|`\[\]()!]/g, '');
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
