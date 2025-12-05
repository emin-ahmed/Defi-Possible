import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AccessRule } from '../../entities/access-rule.entity';
import { CreateAccessRuleDto } from './dto/create-access-rule.dto';
import { UpdateAccessRuleDto } from './dto/update-access-rule.dto';

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(AccessRule)
    private readonly accessRuleRepository: Repository<AccessRule>,
  ) {}

  async createAccessRule(createDto: CreateAccessRuleDto, createdBy: string) {
    const accessRule = this.accessRuleRepository.create({
      userId: createDto.userId,
      startDate: new Date(createDto.startDate),
      endDate: new Date(createDto.endDate),
      createdBy,
    });

    await this.accessRuleRepository.save(accessRule);
    return accessRule;
  }

  async getAllAccessRules() {
    const rules = await this.accessRuleRepository.find({
      relations: ['user', 'creator'],
      order: { createdAt: 'DESC' },
    });

    return { rules };
  }

  async updateAccessRule(id: string, updateDto: UpdateAccessRuleDto) {
    const accessRule = await this.accessRuleRepository.findOne({ where: { id } });

    if (!accessRule) {
      throw new NotFoundException('Access rule not found');
    }

    if (updateDto.startDate) {
      accessRule.startDate = new Date(updateDto.startDate);
    }

    if (updateDto.endDate) {
      accessRule.endDate = new Date(updateDto.endDate);
    }

    if (updateDto.isActive !== undefined) {
      accessRule.isActive = updateDto.isActive;
    }

    await this.accessRuleRepository.save(accessRule);
    return accessRule;
  }

  async deleteAccessRule(id: string) {
    const result = await this.accessRuleRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Access rule not found');
    }

    return { success: true };
  }

  async checkUserAccess(userId: string): Promise<{ hasAccess: boolean; expiresAt?: Date }> {
    const now = new Date();

    const activeRule = await this.accessRuleRepository.findOne({
      where: {
        userId,
        isActive: true,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      order: { endDate: 'DESC' },
    });

    if (activeRule) {
      return {
        hasAccess: true,
        expiresAt: activeRule.endDate,
      };
    }

    return { hasAccess: false };
  }

  async hasActiveAccess(userId: string): Promise<boolean> {
    const result = await this.checkUserAccess(userId);
    return result.hasAccess;
  }
}

