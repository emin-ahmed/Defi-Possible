import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface AISummary {
  summaryText: string;
  keyPoints: string[];
  keywords: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Use AI_SERVICE_URL if available, otherwise fall back to localhost
    this.aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://ai-service:8000');
  }

  async generateSummary(textContent: string): Promise<AISummary> {
    try {
      this.logger.log(`[AI-1] Received text content: ${textContent.length} characters`);
      this.logger.log(`[AI-1] Text preview: "${textContent.substring(0, 200).replace(/\n/g, ' ')}..."`);
      
      this.logger.log(`[AI-2] Sending to AI Service: ${this.aiServiceUrl}/api/analyze`);
      this.logger.log(`[AI-2] Text length: ${textContent.length} characters`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/api/analyze`,
          {
            text: textContent,
            language: 'en', // Can be made configurable if needed
          },
          { timeout: 120000 }, // 2 minute timeout
        ),
      );

      this.logger.log(`[AI-3] ✓ Received response from AI Service`);
      
      const aiResponse = response.data;
      this.logger.log(`[AI-3] Model used: ${aiResponse.model_used}`);
      this.logger.log(`[AI-3] Processing time: ${aiResponse.processing_time}s`);
      this.logger.log(`[AI-3] Response: ${JSON.stringify(aiResponse, null, 2).substring(0, 500)}`);

      const result = {
        summaryText: aiResponse.summary || '',
        keyPoints: aiResponse.key_points || [],
        keywords: aiResponse.keywords || [],
      };

      this.logger.log(`[AI-4] ✓ Generated summary: ${result.summaryText.substring(0, 100)}...`);
      this.logger.log(`[AI-4] ✓ Generated ${result.keyPoints.length} key points`);
      this.logger.log(`[AI-4] ✓ Generated ${result.keywords.length} keywords`);

      return result;
    } catch (error) {
      this.logger.error(`[AI-ERROR] Failed to generate AI summary: ${error.message}`);
      if (error.response) {
        this.logger.error(`[AI-ERROR] Response status: ${error.response.status}`);
        this.logger.error(`[AI-ERROR] Response data: ${JSON.stringify(error.response.data).substring(0, 500)}`);
      }
      throw new InternalServerErrorException('Failed to generate document summary');
    }
  }

  async extractEntities(textContent: string): Promise<any> {
    // Additional AI capability for future use
    // Note: Current AI service doesn't have a dedicated entity extraction endpoint
    // This could be extended in the future
    try {
      this.logger.log('Entity extraction not yet implemented in AI service');
      return {
        names: [],
        dates: [],
        amounts: [],
        locations: [],
        note: 'Entity extraction feature coming soon',
      };
    } catch (error) {
      this.logger.error('Failed to extract entities:', error.message);
      return null;
    }
  }
}

