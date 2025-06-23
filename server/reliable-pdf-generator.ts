export interface ReliablePDFOptions {
  title: string;
  content: string;
  author?: string;
}

export class ReliablePDFGenerator {
  
  static generatePDF(options: ReliablePDFOptions): Buffer {
    const { title, content, author = "Templo do Abismo" } = options;
    
    // Limpar HTML para texto
    const cleanText = this.cleanHTML(content);
    
    // Dividir em páginas
    const pages = this.splitIntoPages(cleanText, 40); // 40 linhas por página
    
    // Gerar PDF estruturado
    const pdfContent = this.createPDFDocument(title, pages, author);
    
    return Buffer.from(pdfContent, 'latin1');
  }
  
  private static cleanHTML(html: string): string {
    // Remover scripts e styles
    let cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
    
    // Converter quebras de linha e elementos de bloco
    cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
    cleaned = cleaned.replace(/<\/?(h[1-6]|p|div|section)[^>]*>/gi, '\n\n');
    
    // Remover todas as tags HTML
    cleaned = cleaned.replace(/<[^>]+>/g, '');
    
    // Decodificar entidades HTML
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&quot;/g, '"');
    cleaned = cleaned.replace(/&#39;/g, "'");
    
    // Limpar espaços em branco
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
    
    return cleaned.trim();
  }
  
  private static splitIntoPages(text: string, linesPerPage: number): string[] {
    const lines = text.split('\n');
    const pages: string[] = [];
    let currentPage: string[] = [];
    let currentLineCount = 0;
    
    for (const line of lines) {
      // Dividir linhas muito longas
      const wrappedLines = this.wrapLine(line, 80);
      
      for (const wrappedLine of wrappedLines) {
        if (currentLineCount >= linesPerPage && currentPage.length > 0) {
          pages.push(currentPage.join('\n'));
          currentPage = [];
          currentLineCount = 0;
        }
        
        currentPage.push(wrappedLine);
        currentLineCount++;
      }
    }
    
    if (currentPage.length > 0) {
      pages.push(currentPage.join('\n'));
    }
    
    return pages.length > 0 ? pages : [text];
  }
  
  private static wrapLine(line: string, maxLength: number): string[] {
    if (line.length <= maxLength) {
      return [line];
    }
    
    const words = line.split(' ');
    const wrapped: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          wrapped.push(currentLine);
        }
        currentLine = word;
      }
    }
    
    if (currentLine) {
      wrapped.push(currentLine);
    }
    
    return wrapped.length > 0 ? wrapped : [line];
  }
  
  private static createPDFDocument(title: string, pages: string[], author: string): string {
    const date = new Date().toISOString();
    const pageCount = pages.length;
    
    // Cabeçalho PDF
    let pdf = '%PDF-1.4\n';
    
    // Objeto 1: Catálogo
    pdf += '1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n\n';
    
    // Objeto 2: Páginas
    const pageRefs = pages.map((_, i) => `${3 + i} 0 R`).join(' ');
    pdf += `2 0 obj\n<<\n/Type /Pages\n/Kids [${pageRefs}]\n/Count ${pageCount}\n>>\nendobj\n\n`;
    
    // Objetos de página e conteúdo
    for (let i = 0; i < pages.length; i++) {
      const pageObj = 3 + i;
      const contentObj = 3 + pages.length + i;
      
      // Objeto da página
      pdf += `${pageObj} 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents ${contentObj} 0 R\n/Resources <<\n/Font << /F1 ${3 + pages.length * 2} 0 R >>\n>>\n>>\nendobj\n\n`;
      
      // Conteúdo da página
      const pageContent = this.createPageContent(title, pages[i], i + 1, pageCount, author);
      pdf += `${contentObj} 0 obj\n<<\n/Length ${pageContent.length}\n>>\nstream\n${pageContent}\nendstream\nendobj\n\n`;
    }
    
    // Objeto de fonte
    const fontObj = 3 + pages.length * 2;
    pdf += `${fontObj} 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n\n`;
    
    // Tabela xref
    const xrefOffset = pdf.length;
    pdf += 'xref\n';
    pdf += `0 ${fontObj + 1}\n`;
    pdf += '0000000000 65535 f \n';
    
    // Calcular offsets (aproximado)
    let offset = 9;
    for (let i = 1; i <= fontObj; i++) {
      pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
      offset += 100; // Estimativa
    }
    
    // Trailer
    pdf += 'trailer\n<<\n/Size ' + (fontObj + 1) + '\n/Root 1 0 R\n>>\n';
    pdf += 'startxref\n' + xrefOffset + '\n%%EOF';
    
    return pdf;
  }
  
  private static createPageContent(title: string, text: string, pageNum: number, totalPages: number, author: string): string {
    let content = 'BT\n';
    
    // Título na primeira página
    if (pageNum === 1) {
      content += '/F1 18 Tf\n';
      content += '50 750 Td\n';
      content += `(${this.escapePDFString(title)}) Tj\n`;
      content += '0 -40 Td\n';
      content += '/F1 10 Tf\n';
      content += `(${this.escapePDFString(author)}) Tj\n`;
      content += '0 -30 Td\n';
    } else {
      content += '/F1 12 Tf\n';
      content += '50 750 Td\n';
    }
    
    // Conteúdo principal
    content += '/F1 11 Tf\n';
    const lines = text.split('\n');
    let currentY = pageNum === 1 ? 650 : 720; // Começar mais baixo na primeira página
    
    for (const line of lines) {
      if (currentY < 50) break; // Parar se chegou no fim da página
      
      if (line.trim()) {
        // Dividir linha longa em várias linhas
        const wrappedLines = ReliablePDFGenerator.wrapLineForPDF(line, 80);
        for (const wrappedLine of wrappedLines) {
          if (currentY < 50) break;
          content += `(${ReliablePDFGenerator.escapePDFString(wrappedLine)}) Tj\n`;
          content += '0 -15 Td\n';
          currentY -= 15;
        }
      } else {
        content += '0 -10 Td\n';
        currentY -= 10;
      }
    }
    
    // Número da página
    content += '0 -50 Td\n';
    content += '/F1 9 Tf\n';
    content += `(Página ${pageNum} de ${totalPages}) Tj\n`;
    
    content += 'ET';
    return content;
  }
  
  private static wrapLineForPDF(line: string, maxLength: number): string[] {
    if (line.length <= maxLength) {
      return [line];
    }
    
    const words = line.split(' ');
    const wrapped: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          wrapped.push(currentLine);
        }
        currentLine = word.length > maxLength ? word.substring(0, maxLength) : word;
      }
    }
    
    if (currentLine) {
      wrapped.push(currentLine);
    }
    
    return wrapped.length > 0 ? wrapped : [line.substring(0, maxLength)];
  }

  private static escapePDFString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[\r\n]/g, ' ')
      .substring(0, 200); // Aumentar limite para incluir mais texto
  }
}