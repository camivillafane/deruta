import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/index.js';

@Injectable()
export class BlockedUserGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    if (!userId) return true;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user?.isBlocked) {
      throw new ForbiddenException(user.blockedReason || 'Tu cuenta ha sido bloqueada. Contactá al soporte.');
    }
    return true;
  }
}
