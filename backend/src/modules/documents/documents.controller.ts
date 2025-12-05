import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  StreamableFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccessGuard } from '../../common/guards/access.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { DocumentQueryDto } from './dto/document-query.dto';

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, AccessGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document' })
  @ApiConsumes('multipart/form-data')
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.documentsService.uploadDocument(file, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get user documents' })
  async getDocuments(
    @CurrentUser() user: User,
    @Query() query: DocumentQueryDto,
  ) {
    return this.documentsService.getUserDocuments(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  async getDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.documentsService.getDocument(id, user.id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get document summary' })
  async getDocumentSummary(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.documentsService.getDocumentSummary(id, user.id);
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Download document file' })
  async downloadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<StreamableFile> {
    return this.documentsService.downloadDocument(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  async deleteDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.documentsService.deleteDocument(id, user.id);
  }
}

