import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';

@Injectable()
export class MayanService {
  private readonly logger = new Logger(MayanService.name);
  private readonly baseUrl: string;
  private readonly apiToken: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('MAYAN_URL');
    this.apiToken = this.configService.get('MAYAN_API_TOKEN');
  }

  private getHeaders() {
    return {
      Authorization: `Token ${this.apiToken}`,
    };
  }

  async uploadDocument(file: Express.Multer.File): Promise<{ id: string; label: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, file.originalname);
      formData.append('document_type_id', '1');
      formData.append('label', file.originalname);

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/v4/documents/upload/`, formData, {
          headers: {
            ...this.getHeaders(),
            ...formData.getHeaders(),
          },
        }),
      );

      this.logger.log(`Document uploaded to Mayan: ${response.data.id}`);

      const documentId = response.data.id.toString();

      // Trigger OCR processing for the document
      try {
        await this.submitDocumentForOcr(documentId);
        this.logger.log(`OCR processing triggered for document: ${documentId}`);
      } catch (error) {
        this.logger.warn(`Failed to trigger OCR for document ${documentId}: ${error.message}`);
        // Don't fail the upload if OCR trigger fails
      }

      return {
        id: documentId,
        label: response.data.label,
      };
    } catch (error) {
      this.logger.error('Failed to upload document to Mayan:', error.message);
      throw new InternalServerErrorException('Failed to upload document to Mayan EDMS');
    }
  }

  async submitDocumentForOcr(documentId: string): Promise<void> {
    try {
      this.logger.log(`[OCR-SUBMIT] Submitting document ${documentId} for OCR processing...`);
      
      // First, get the latest version
      const versionsResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v4/documents/${documentId}/versions/`, {
          headers: this.getHeaders(),
        }),
      );
      
      const versions = versionsResponse.data.results || [];
      if (versions.length === 0) {
        throw new Error('No versions found for document');
      }
      
      const latestVersion = versions[versions.length - 1];
      this.logger.log(`[OCR-SUBMIT] Found version ${latestVersion.id}, submitting for OCR...`);
      
      // Submit the VERSION for OCR processing (not the document)
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/api/v4/documents/${documentId}/versions/${latestVersion.id}/ocr/submit/`,
          {},
          {
            headers: this.getHeaders(),
          },
        ),
      );
      
      this.logger.log(`[OCR-SUBMIT] ✓ OCR submission successful (status: ${response.status})`);
    } catch (error) {
      this.logger.error(`[OCR-SUBMIT] ✗ Failed to submit document for OCR: ${error.message}`);
      if (error.response) {
        this.logger.error(`[OCR-SUBMIT] Response status: ${error.response.status}`);
        this.logger.error(`[OCR-SUBMIT] Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async waitForOcr(documentId: string, maxWaitSeconds: number = 120): Promise<void> {
    const pollInterval = 3000; // 3 seconds
    const maxAttempts = Math.ceil((maxWaitSeconds * 1000) / pollInterval);
    const initialDelay = 5000; // 5 seconds initial delay

    this.logger.log(`[WAIT-OCR] Starting OCR polling for document ${documentId}`);
    this.logger.log(`[WAIT-OCR] Waiting ${initialDelay}ms for OCR to start...`);
    
    // Give Mayan time to start processing the OCR
    await new Promise((resolve) => setTimeout(resolve, initialDelay));
    
    this.logger.log(`[WAIT-OCR] Beginning polling - Max attempts: ${maxAttempts} (${maxWaitSeconds}s total)`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        this.logger.log(`[WAIT-OCR] Attempt ${attempt + 1}/${maxAttempts}...`);
        
        // Get the latest version
        const versionsResponse = await firstValueFrom(
          this.httpService.get(`${this.baseUrl}/api/v4/documents/${documentId}/versions/`, {
            headers: this.getHeaders(),
          }),
        );

        const versions = versionsResponse.data.results || [];
        this.logger.log(`[WAIT-OCR] Found ${versions.length} version(s)`);
        
        if (versions.length === 0) {
          this.logger.log(`[WAIT-OCR] No versions yet, waiting...`);
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          continue;
        }

        const latestVersion = versions[versions.length - 1];
        this.logger.log(`[WAIT-OCR] Version ID: ${latestVersion.id}`);

        // Get pages for this version
        const pagesResponse = await firstValueFrom(
          this.httpService.get(`${this.baseUrl}/api/v4/documents/${documentId}/versions/${latestVersion.id}/pages/`, {
            headers: this.getHeaders(),
          }),
        );

        const pages = pagesResponse.data.results || [];
        this.logger.log(`[WAIT-OCR] Found ${pages.length} page(s)`);
        
        if (pages.length > 0) {
          // Check if at least one page has OCR content using the correct endpoint
          const firstPage = pages[0];
          this.logger.log(`[WAIT-OCR] Checking page ${firstPage.id} for OCR content...`);
          
          const pageOcrResponse = await firstValueFrom(
            this.httpService.get(`${this.baseUrl}/api/v4/documents/${documentId}/versions/${latestVersion.id}/pages/${firstPage.id}/ocr/`, {
              headers: this.getHeaders(),
            }),
          );

          const ocrContent = pageOcrResponse.data.content || '';
          const contentLength = ocrContent.length;
          this.logger.log(`[WAIT-OCR] Page ${firstPage.id} OCR content: ${contentLength} chars`);
          
          if (contentLength > 0) {
            this.logger.log(`[WAIT-OCR] ✓✓✓ OCR completed for document: ${documentId}`);
            return;
          } else {
            this.logger.log(`[WAIT-OCR] OCR not ready yet, waiting ${pollInterval}ms...`);
          }
        } else {
          this.logger.log(`[WAIT-OCR] No pages yet, waiting...`);
        }
      } catch (error) {
        this.logger.warn(`[WAIT-OCR] Error during polling (attempt ${attempt + 1}): ${error.message}`);
        // OCR might not be ready yet, continue polling
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    this.logger.error(`[WAIT-OCR] ✗✗✗ OCR processing timeout after ${maxWaitSeconds}s`);
    throw new InternalServerErrorException('OCR processing timeout');
  }

  async getDocumentOcrTextWithRetry(documentId: string, maxAttempts: number = 20): Promise<string> {
    const delayMs = 5000; // 5 seconds between attempts
    
    this.logger.log(`[OCR-RETRY] Starting OCR extraction with retry for document ${documentId}`);
    this.logger.log(`[OCR-RETRY] Initial delay: 10 seconds (let Mayan start OCR)...`);
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Initial 10s delay
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logger.log(`[OCR-RETRY] Attempt ${attempt}/${maxAttempts}...`);
        const ocrText = await this.getDocumentOcrText(documentId);
        
        if (ocrText && ocrText.trim().length > 0) {
          this.logger.log(`[OCR-RETRY] ✓✓✓ Success! Got ${ocrText.length} chars on attempt ${attempt}`);
          return ocrText;
        }
        
        this.logger.log(`[OCR-RETRY] Attempt ${attempt}: No content yet, waiting ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } catch (error) {
        this.logger.warn(`[OCR-RETRY] Attempt ${attempt} error: ${error.message}`);
        if (attempt === maxAttempts) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    
    throw new InternalServerErrorException(`OCR extraction failed after ${maxAttempts} attempts`);
  }

  async getDocumentOcrText(documentId: string): Promise<string> {
    try {
      this.logger.log(`[OCR-1] Getting versions for document ${documentId}`);
      this.logger.log(`[OCR-1] API Call: GET ${this.baseUrl}/api/v4/documents/${documentId}/versions/`);
      
      // Step 1: Get the latest version
      const versionsResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v4/documents/${documentId}/versions/`, {
          headers: this.getHeaders(),
        }),
      );

      const versions = versionsResponse.data.results || [];
      this.logger.log(`[OCR-1] ✓ Found ${versions.length} version(s)`);
      
      if (versions.length === 0) {
        throw new Error('No versions found for document');
      }

      const latestVersion = versions[versions.length - 1];
      this.logger.log(`[OCR-2] Using version ${latestVersion.id}`);
      this.logger.log(`[OCR-2] API Call: GET ${this.baseUrl}/api/v4/documents/${documentId}/versions/${latestVersion.id}/pages/`);

      // Step 2: Get all pages
      const pagesResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v4/documents/${documentId}/versions/${latestVersion.id}/pages/`, {
          headers: this.getHeaders(),
        }),
      );

      const pages = pagesResponse.data.results || [];
      this.logger.log(`[OCR-2] ✓ Found ${pages.length} page(s)`);
      
      if (pages.length === 0) {
        throw new Error('No pages found for document');
      }

      // Step 3: Get OCR content for each page using the correct endpoint
      const ocrTexts: string[] = [];

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        try {
          this.logger.log(`[OCR-3.${i+1}] Getting OCR for page ${page.id} (page number ${page.page_number})`);
          this.logger.log(`[OCR-3.${i+1}] API Call: GET ${this.baseUrl}/api/v4/documents/${documentId}/versions/${latestVersion.id}/pages/${page.id}/ocr/`);
          
          const pageOcrResponse = await firstValueFrom(
            this.httpService.get(`${this.baseUrl}/api/v4/documents/${documentId}/versions/${latestVersion.id}/pages/${page.id}/ocr/`, {
              headers: this.getHeaders(),
            }),
          );

          const content = pageOcrResponse.data.content || '';
          
          if (content) {
            const contentLength = content.length;
            const preview = content.substring(0, 100).replace(/\n/g, ' ');
            this.logger.log(`[OCR-3.${i+1}] ✓ OCR content: ${contentLength} chars - "${preview}..."`);
            ocrTexts.push(content);
          } else {
            this.logger.log(`[OCR-3.${i+1}] ⚠ No OCR content for this page`);
          }
        } catch (error) {
          this.logger.warn(`[OCR-3.${i+1}] ✗ Failed to get OCR for page ${page.id}: ${error.message}`);
          // Continue with other pages
        }
      }

      const fullText = ocrTexts.join('\n\n');
      this.logger.log(`[OCR-4] ✓ Total extracted: ${ocrTexts.length} pages, ${fullText.length} characters`);
      this.logger.log(`[OCR-4] ========================================`);
      this.logger.log(`[OCR-4] FULL CONCATENATED TEXT:`);
      this.logger.log(`[OCR-4] ========================================`);
      this.logger.log(fullText);
      this.logger.log(`[OCR-4] ========================================`);
      this.logger.log(`[OCR-4] END OF OCR TEXT`);
      this.logger.log(`[OCR-4] ========================================`);

      return fullText;
    } catch (error) {
      this.logger.error(`[OCR-ERROR] Failed to get OCR text: ${error.message}`);
      if (error.response) {
        this.logger.error(`[OCR-ERROR] Response status: ${error.response.status}`);
        this.logger.error(`[OCR-ERROR] Response data: ${JSON.stringify(error.response.data).substring(0, 500)}`);
      }
      throw new InternalServerErrorException('Failed to retrieve OCR text');
    }
  }

  async getDocumentFile(documentId: string): Promise<Buffer> {
    try {
      // First, get the list of files to get the latest file ID
      const filesResponse = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v4/documents/${documentId}/files/`, {
          headers: this.getHeaders(),
        }),
      );

      const files = filesResponse.data.results || [];
      if (files.length === 0) {
        throw new Error('No files found for document');
      }

      // Get the latest file (last in array)
      const latestFile = files[files.length - 1];
      const fileId = latestFile.id;

      // Download the file using the specific file ID
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v4/documents/${documentId}/files/${fileId}/download/`, {
          headers: this.getHeaders(),
          responseType: 'arraybuffer',
        }),
      );

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error('Failed to get document file from Mayan:', error.message);
      throw new InternalServerErrorException('Failed to retrieve document file');
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/api/v4/documents/${documentId}/`, {
          headers: this.getHeaders(),
        }),
      );

      this.logger.log(`Document deleted from Mayan: ${documentId}`);
    } catch (error) {
      this.logger.error('Failed to delete document from Mayan:', error.message);
      throw new InternalServerErrorException('Failed to delete document from Mayan EDMS');
    }
  }

  async searchDocuments(query: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v4/documents/`, {
          headers: this.getHeaders(),
          params: { q: query },
        }),
      );

      return response.data.results || [];
    } catch (error) {
      this.logger.error('Failed to search documents in Mayan:', error.message);
      throw new InternalServerErrorException('Failed to search documents');
    }
  }
}

