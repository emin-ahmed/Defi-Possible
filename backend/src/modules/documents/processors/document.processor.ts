import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DocumentsService } from '../documents.service';
import { MayanService } from '../../mayan/mayan.service';
import { AiService } from '../../ai/ai.service';
import { SummaryStatus } from '../../../entities/document.entity';

@Processor('documents')
export class DocumentProcessor {
  private readonly logger = new Logger(DocumentProcessor.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly mayanService: MayanService,
    private readonly aiService: AiService,
  ) {}

  @Process('process-document')
  async handleDocumentProcessing(job: Job) {
    const { documentId, mayanDocumentId } = job.data;

    try {
      this.logger.log(`========================================`);
      this.logger.log(`[PROCESSOR] Starting document processing`);
      this.logger.log(`[PROCESSOR] Document ID: ${documentId}`);
      this.logger.log(`[PROCESSOR] Mayan Document ID: ${mayanDocumentId}`);
      this.logger.log(`========================================`);

      // Update status to processing
      this.logger.log(`[PROCESSOR] Step 1: Updating status to PROCESSING`);
      await this.documentsService.updateDocumentStatus(documentId, SummaryStatus.PROCESSING);
      this.logger.log(`[PROCESSOR] ✓ Status updated`);

      // Get OCR text (with built-in waiting/retry)
      this.logger.log(`[PROCESSOR] Step 2: Getting OCR text (with retry)...`);
      const ocrText = await this.mayanService.getDocumentOcrTextWithRetry(mayanDocumentId);
      this.logger.log(`[PROCESSOR] ✓ OCR text extracted: ${ocrText.length} characters`);

      if (!ocrText || ocrText.trim().length === 0) {
        throw new Error('No OCR text extracted from document');
      }

      // Generate AI summary
      this.logger.log(`[PROCESSOR] Step 4: Generating AI summary...`);
      const summary = await this.aiService.generateSummary(ocrText);
      this.logger.log(`[PROCESSOR] ✓ AI summary generated`);

      // Update document with summary
      this.logger.log(`[PROCESSOR] Step 5: Saving summary to database...`);
      await this.documentsService.updateDocumentSummary(documentId, summary);
      this.logger.log(`[PROCESSOR] ✓ Summary saved`);

      this.logger.log(`========================================`);
      this.logger.log(`[PROCESSOR] ✓✓✓ Document processed successfully: ${documentId}`);
      this.logger.log(`========================================`);
    } catch (error) {
      this.logger.log(`========================================`);
      this.logger.error(`[PROCESSOR] ✗✗✗ Failed to process document ${documentId}`);
      this.logger.error(`[PROCESSOR] Error: ${error.message}`);
      this.logger.error(`[PROCESSOR] Stack: ${error.stack}`);
      this.logger.log(`========================================`);
      await this.documentsService.updateDocumentStatus(documentId, SummaryStatus.FAILED);
      throw error;
    }
  }
}

