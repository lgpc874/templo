// Utilitários para processamento de texto

/**
 * Extrai texto limpo do HTML removendo tags e decodificando entidades
 */
export const extractTextFromHTML = (html: string): string => {
  if (!html) return '';
  
  // Remove tags HTML
  let text = html.replace(/<[^>]*>/g, '');
  
  // Decodifica entidades HTML comuns
  text = text.replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&amp;/g, '&')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'")
             .replace(/&nbsp;/g, ' ')
             .replace(/&apos;/g, "'")
             .replace(/&copy;/g, '©')
             .replace(/&reg;/g, '®')
             .replace(/&trade;/g, '™');
  
  // Remove espaços extras e quebras de linha
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};

/**
 * Trunca texto com reticências se exceder o limite
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Extrai e trunca texto do HTML em uma única função
 */
export const extractAndTruncateHTML = (html: string, maxLength: number = 100): string => {
  const cleanText = extractTextFromHTML(html);
  return truncateText(cleanText, maxLength);
};