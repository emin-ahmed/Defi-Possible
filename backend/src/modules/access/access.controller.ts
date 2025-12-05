import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccessService } from './access.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../../entities/user.entity';
import { CreateAccessRuleDto } from './dto/create-access-rule.dto';
import { UpdateAccessRuleDto } from './dto/update-access-rule.dto';

@ApiTags('access')
@Controller('access')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Post('grant')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Grant access to user (Admin only)' })
  async grantAccess(
    @Body() createAccessRuleDto: CreateAccessRuleDto,
    @CurrentUser() admin: User,
  ) {
    return this.accessService.createAccessRule(createAccessRuleDto, admin.id);
  }

  @Get('rules')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all access rules (Admin only)' })
  async getAllRules() {
    return this.accessService.getAllAccessRules();
  }

  @Put('rules/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update access rule (Admin only)' })
  async updateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAccessRuleDto: UpdateAccessRuleDto,
  ) {
    return this.accessService.updateAccessRule(id, updateAccessRuleDto);
  }

  @Delete('rules/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete access rule (Admin only)' })
  async deleteRule(@Param('id', ParseUUIDPipe) id: string) {
    return this.accessService.deleteAccessRule(id);
  }

  @Get('check')
  @ApiOperation({ summary: 'Check current user access' })
  async checkAccess(@CurrentUser() user: User) {
    return this.accessService.checkUserAccess(user.id);
  }
}

