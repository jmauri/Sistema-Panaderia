import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  async login(@Body() body: { usernameOrEmail: string; password: string }) {
    const user = await this.auth.validateUser(body.usernameOrEmail, body.password);
    if (!user) throw new BadRequestException('Invalid credentials');
    return this.auth.login(user);
  }
}
