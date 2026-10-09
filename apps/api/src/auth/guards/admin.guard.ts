import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service.js';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    if (!userId) {
      throw new ForbiddenException('Acceso denegado');
    }
    const user = await this.usersService.findById(userId);
    if (user.role !== 'admin') {
      throw new ForbiddenException('Acceso denegado');
    }
    return true;
  }
}
