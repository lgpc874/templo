import { jsPDF } from 'jspdf';

export interface PDFOptions {
  title: string;
  content: string;
  customCss?: string;
  includeImages?: boolean;
}

export class AdvancedPDFGenerator {
  
  static generateGrimoirePDF(options: PDFOptions): Buffer {
    const { title, content } = options;
    
    // Criar nova instância do jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configurações de página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let currentY = margin;

    // Adicionar título principal
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(139, 90, 60); // Cor âmbar escura
    
    const titleLines = doc.splitTextToSize(title, maxWidth);
    titleLines.forEach((line: string) => {
      doc.text(line, pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;
    });
    
    // Linha decorativa
    currentY += 5;
    doc.setDrawColor(217, 119, 6); // Cor âmbar
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // Subtítulo
    doc.setFont('times', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Templo do Abismo - Grimório Luciferiano', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // Processar conteúdo HTML
    const processedContent = this.processHTMLContent(content);
    
    // Configurar fonte para o corpo do texto
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    // Adicionar conteúdo por seções
    processedContent.forEach((section) => {
      currentY = this.addSection(doc, section, currentY, margin, maxWidth, pageHeight);
    });

    // Adicionar rodapé na última página
    this.addFooter(doc);

    // Converter para Buffer
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  }

  private static processHTMLContent(html: string): Array<{type: string, content: string, level?: number}> {
    const sections: Array<{type: string, content: string, level?: number}> = [];
    
    // Limpar HTML e dividir em seções
    let cleanHtml = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Extrair títulos e parágrafos
    const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
    const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
    const h3Regex = /<h3[^>]*>(.*?)<\/h3>/gi;
    const pRegex = /<p[^>]*>(.*?)<\/p>/gi;
    const divRegex = /<div[^>]*>(.*?)<\/div>/gi;

    let match;

    // Processar H1
    while ((match = h1Regex.exec(cleanHtml)) !== null) {
      sections.push({
        type: 'heading',
        content: this.stripTags(match[1]),
        level: 1
      });
    }

    // Processar H2
    while ((match = h2Regex.exec(cleanHtml)) !== null) {
      sections.push({
        type: 'heading',
        content: this.stripTags(match[1]),
        level: 2
      });
    }

    // Processar H3
    while ((match = h3Regex.exec(cleanHtml)) !== null) {
      sections.push({
        type: 'heading',
        content: this.stripTags(match[1]),
        level: 3
      });
    }

    // Processar parágrafos
    while ((match = pRegex.exec(cleanHtml)) !== null) {
      const content = this.stripTags(match[1]).trim();
      if (content.length > 0) {
        sections.push({
          type: 'paragraph',
          content: content
        });
      }
    }

    // Se não encontrou seções estruturadas, processar como texto corrido
    if (sections.length === 0) {
      const textContent = this.stripTags(cleanHtml)
        .split('\n')
        .filter(line => line.trim().length > 0);
      
      textContent.forEach(line => {
        sections.push({
          type: 'paragraph',
          content: line.trim()
        });
      });
    }

    return sections;
  }

  private static stripTags(html: string): string {
    return html.replace(/<[^>]+>/g, '').trim();
  }

  private static addSection(
    doc: jsPDF, 
    section: {type: string, content: string, level?: number}, 
    currentY: number, 
    margin: number, 
    maxWidth: number, 
    pageHeight: number
  ): number {
    
    // Verificar se precisa de nova página
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = margin;
    }

    if (section.type === 'heading') {
      // Configurar fonte para título
      doc.setFont('times', 'bold');
      
      switch (section.level) {
        case 1:
          doc.setFontSize(16);
          doc.setTextColor(139, 90, 60);
          currentY += 10;
          break;
        case 2:
          doc.setFontSize(14);
          doc.setTextColor(139, 90, 60);
          currentY += 8;
          break;
        case 3:
          doc.setFontSize(12);
          doc.setTextColor(100, 100, 100);
          currentY += 6;
          break;
        default:
          doc.setFontSize(12);
          doc.setTextColor(139, 90, 60);
          currentY += 6;
      }

      const titleLines = doc.splitTextToSize(section.content, maxWidth);
      titleLines.forEach((line: string) => {
        doc.text(line, margin, currentY);
        currentY += 6;
      });
      
      currentY += 3;
      
    } else if (section.type === 'paragraph') {
      // Configurar fonte para parágrafo
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
      const paragraphLines = doc.splitTextToSize(section.content, maxWidth);
      
      // Verificar se o parágrafo cabe na página
      const requiredHeight = paragraphLines.length * 5 + 8;
      if (currentY + requiredHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      
      paragraphLines.forEach((line: string) => {
        doc.text(line, margin, currentY);
        currentY += 5;
      });
      
      currentY += 8; // Espaço entre parágrafos
    }

    return currentY;
  }

  private static addFooter(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Linha decorativa
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.3);
      doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);
      
      // Texto do rodapé
      doc.setFont('times', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      
      doc.text('Templo do Abismo', 20, pageHeight - 8);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, pageHeight - 8, { align: 'right' });
      
      // Data
      const date = new Date().toLocaleDateString('pt-BR');
      doc.text(date, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }
  }
}