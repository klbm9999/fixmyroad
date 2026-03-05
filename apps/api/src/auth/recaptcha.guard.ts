import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RecaptchaGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>('RECAPTCHA_SECRET');
    if (!secret) return true;
    const request = context.switchToHttp().getRequest();
    const token = request.body?.recaptchaToken ?? request.headers['x-recaptcha-token'];
    if (!token) return false;
    return true;
  }
}
