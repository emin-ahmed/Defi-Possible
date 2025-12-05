import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AccessService } from '../../modules/access/access.service';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly accessService: AccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Admin always has access
    if (user.role === 'admin') {
      return true;
    }

    // Check temporary access for regular users
    const hasAccess = await this.accessService.hasActiveAccess(user.id);

    if (!hasAccess) {
      throw new ForbiddenException('Your access period has expired. Please contact an administrator.');
    }

    return true;
  }
}

