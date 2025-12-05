import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { StreamableFile } from '@nestjs/common';
import { Document, SummaryStatus } from '../../entities/document.entity';
import { MayanService } from '../mayan/mayan.service';
import { DocumentQueryDto } from './dto/document-query.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectQueue('documents')
    private readonly documentQueue: Queue,
    private readonly mayanService: MayanService,
  ) {}

  async uploadDocument(file: Express.Multer.File, userId: string) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: PDF, JPG, PNG, DOCX');
    }

    // Upload to Mayan EDMS
    const mayanDocument = await this.mayanService.uploadDocument(file);

    // Create document record
    const document = this.documentRepository.create({
      userId,
      mayanDocumentId: mayanDocument.id,
      filename: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      summaryStatus: SummaryStatus.PENDING,
    });

    await this.documentRepository.save(document);

    // Queue AI processing job
    await this.documentQueue.add('process-document', {
      documentId: document.id,
      mayanDocumentId: mayanDocument.id,
    });

    return {
      documentId: document.id,
      filename: document.filename,
      status: 'processing',
      summaryPending: true,
    };
  }

  async getUserDocuments(userId: string, query: DocumentQueryDto) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .where('document.userId = :userId', { userId })
      .orderBy('document.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (search) {
      queryBuilder.andWhere('document.filename ILIKE :search', { search: `%${search}%` });
    }

    const [documents, total] = await queryBuilder.getManyAndCount();

    return {
      documents,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async getDocument(documentId: string, userId: string) {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return document;
  }

  async getDocumentSummary(documentId: string, userId: string) {
    const document = await this.getDocument(documentId, userId);

    return {
      summaryText: document.summaryText,
      keyPoints: document.keyPoints,
      keywords: document.keywords,
      status: document.summaryStatus,
    };
  }

  async downloadDocument(documentId: string, userId: string): Promise<StreamableFile> {
    const document = await this.getDocument(documentId, userId);

    const fileBuffer = await this.mayanService.getDocumentFile(document.mayanDocumentId);

    return new StreamableFile(fileBuffer, {
      type: document.mimeType,
      disposition: `attachment; filename="${document.filename}"`,
    });
  }

  async deleteDocument(documentId: string, userId: string) {
    const document = await this.getDocument(documentId, userId);

    // Delete from Mayan
    await this.mayanService.deleteDocument(document.mayanDocumentId);

    // Delete from database
    await this.documentRepository.remove(document);

    return { success: true };
  }

  async updateDocumentSummary(
    documentId: string,
    summary: { summaryText: string; keyPoints: string[]; keywords: string[] },
  ) {
    await this.documentRepository.update(documentId, {
      summaryText: summary.summaryText,
      keyPoints: summary.keyPoints,
      keywords: summary.keywords,
      summaryStatus: SummaryStatus.COMPLETED,
    });
  }

  async updateDocumentStatus(documentId: string, status: SummaryStatus) {
    await this.documentRepository.update(documentId, { summaryStatus: status });
  }
}

