import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async validateUser(usernameOrEmail: string, pass: string) {
    const user = (await this.users.findByUsername(usernameOrEmail)) || (await this.users.findByEmail(usernameOrEmail));
    if (!user) return null;
    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) return null;
    const { password, ...rest } = user as any;
    return rest;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return { access_token: this.jwt.sign(payload), user: { id: user.id, username: user.username, name: user.name, role: user.role } };
  }
}
