// Fallback PDF generator usando HTML simples (caso Puppeteer falhe)
export class SimplePDFGenerator {
  
  static generateSimplePDF(options: { title: string; content: string }): Buffer {
    const { title, content } = options;
    
    // Limpar HTML para texto simples
    const textContent = this.htmlToText(content);
    
    // Criar PDF simples usando bibliotecas nativas
    const pdfContent = this.createBasicPDF(title, textContent);
    
    return Buffer.from(pdfContent, 'binary');
  }
  
  private static htmlToText(html: string): string {
    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  private static createBasicPDF(title: string, content: string): string {
    const date = new Date().toLocaleDateString('pt-BR');
    
    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length ${content.length + title.length + 200}
>>
stream
BT
/F1 16 Tf
50 750 Td
(${title}) Tj
0 -30 Td
/F1 12 Tf
(${content.substring(0, 2000)}...) Tj
0 -20 Td
(Templo do Abismo - ${date}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000458 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
556
%%EOF`;
  }
}