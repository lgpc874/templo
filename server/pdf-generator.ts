import puppeteer from 'puppeteer';
import { formatGrimoireContent, GRIMOIRE_CSS } from './content-formatter';

export interface PDFGenerationOptions {
  title: string;
  content: string;
  customCss?: string;
  includeImages?: boolean;
}

export class PDFGenerator {
  
  static async generateGrimoirePDF(options: PDFGenerationOptions): Promise<Buffer> {
    let browser;
    
    try {
      // Inicializar Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Configurar viewport para PDF
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 1
      });

      // Gerar HTML formatado
      const htmlContent = this.generatePDFHTML(options);
      
      // Carregar HTML na página
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });

      // Gerar PDF
      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; color: #666; text-align: center; width: 100%; margin: 0 15mm;">
            <span style="color: #d97706;">${options.title}</span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; color: #666; text-align: center; width: 100%; margin: 0 15mm;">
            <span style="color: #d97706;">Templo do Abismo</span> - 
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `
      });

      return Buffer.from(pdfUint8Array);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Falha na geração do PDF');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private static generatePDFHTML(options: PDFGenerationOptions): string {
    const { title, content, customCss = '' } = options;
    
    // Processar conteúdo HTML removendo elementos não-PDF
    const cleanContent = this.cleanContentForPDF(content);
    
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        /* Reset e configurações básicas */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: white;
            font-size: 12pt;
        }
        
        /* Tipografia para PDF */
        h1, h2, h3, h4, h5, h6 {
            color: #8b5a3c;
            margin-bottom: 12pt;
            margin-top: 18pt;
            page-break-after: avoid;
        }
        
        h1 {
            font-size: 24pt;
            text-align: center;
            border-bottom: 2px solid #d97706;
            padding-bottom: 12pt;
            margin-bottom: 24pt;
        }
        
        h2 {
            font-size: 18pt;
            margin-top: 24pt;
        }
        
        h3 {
            font-size: 16pt;
        }
        
        h4 {
            font-size: 14pt;
        }
        
        p {
            margin-bottom: 12pt;
            text-align: justify;
            orphans: 3;
            widows: 3;
        }
        
        /* Elementos especiais */
        .chapter-title {
            font-size: 20pt;
            text-align: center;
            color: #8b5a3c;
            margin: 24pt 0 18pt 0;
            page-break-before: always;
            text-transform: uppercase;
            letter-spacing: 1pt;
        }
        
        .section-title {
            font-size: 16pt;
            color: #d97706;
            margin: 18pt 0 12pt 0;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
        }
        
        .ritual-text {
            font-style: italic;
            background: #f8f6f0;
            padding: 12pt;
            margin: 12pt 0;
            border-left: 4px solid #d97706;
        }
        
        .latin-text {
            font-style: italic;
            color: #8b5a3c;
            font-weight: 500;
        }
        
        .power-word {
            font-weight: bold;
            color: #7c2d12;
            text-transform: uppercase;
            letter-spacing: 1pt;
        }
        
        /* Formatação de citações */
        blockquote {
            margin: 18pt 24pt;
            padding: 12pt;
            background: #f8f6f0;
            border-left: 4px solid #d97706;
            font-style: italic;
        }
        
        /* Listas */
        ul, ol {
            margin: 12pt 0 12pt 24pt;
        }
        
        li {
            margin-bottom: 6pt;
        }
        
        /* Quebras de página */
        .page-break {
            page-break-before: always;
        }
        
        .avoid-break {
            page-break-inside: avoid;
        }
        
        /* Decorações textuais */
        .ornament {
            text-align: center;
            font-size: 18pt;
            color: #d97706;
            margin: 18pt 0;
        }
        
        .separator {
            text-align: center;
            font-size: 14pt;
            color: #8b5a3c;
            margin: 12pt 0;
        }
        
        /* Remover elementos web-específicos */
        .web-only, .interactive, .button, .link {
            display: none !important;
        }
        
        /* CSS customizado adicional */
        ${customCss}
        
        /* Aplicar estilos do grimório */
        ${GRIMOIRE_CSS}
    </style>
</head>
<body>
    <div class="grimoire-content">
        <h1 class="grimoire-title">${title}</h1>
        <div class="ornament">◆ ◇ ◆</div>
        
        <div class="content-body">
            ${cleanContent}
        </div>
        
        <div class="ornament" style="margin-top: 36pt;">◆ ◇ ◆</div>
        <div style="text-align: center; margin-top: 24pt; font-style: italic; color: #8b5a3c;">
            Templo do Abismo<br>
            Grimório Luciferiano
        </div>
    </div>
</body>
</html>`;
  }

  private static cleanContentForPDF(content: string): string {
    // Remover elementos interativos e específicos da web
    let cleanContent = content
      .replace(/<button[^>]*>.*?<\/button>/gi, '')
      .replace(/<input[^>]*>/gi, '')
      .replace(/<form[^>]*>.*?<\/form>/gi, '')
      .replace(/class="[^"]*interactive[^"]*"/gi, '')
      .replace(/class="[^"]*web-only[^"]*"/gi, '')
      .replace(/onclick="[^"]*"/gi, '')
      .replace(/href="#[^"]*"/gi, '');
    
    // Converter elementos HTML para formatação PDF
    cleanContent = cleanContent
      .replace(/<h1[^>]*>/gi, '<h1 class="chapter-title">')
      .replace(/<h2[^>]*>/gi, '<h2 class="section-title">')
      .replace(/<em>([^<]+)<\/em>/gi, '<span class="latin-text">$1</span>')
      .replace(/<strong>([^<]+)<\/strong>/gi, '<span class="power-word">$1</span>')
      .replace(/<div class="ritual[^"]*"[^>]*>/gi, '<div class="ritual-text">')
      .replace(/<hr[^>]*>/gi, '<div class="separator">◆ ◇ ◆</div>');
    
    // Adicionar quebras de página em capítulos
    cleanContent = cleanContent.replace(
      /<h1 class="chapter-title">/gi,
      '<div class="page-break"></div><h1 class="chapter-title">'
    );
    
    return cleanContent;
  }
}

export default PDFGenerator;