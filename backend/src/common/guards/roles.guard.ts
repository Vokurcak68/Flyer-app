import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      console.log('❌ RolesGuard: No user or role found');
      return false;
    }

    const hasRole = requiredRoles.includes(user.role);
    console.log('🔐 RolesGuard:', {
      requiredRoles,
      userRole: user.role,
      hasRole,
      url: request.url,
      method: request.method
    });

    return hasRole;
  }
}
