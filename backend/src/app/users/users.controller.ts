import { Controller, Post, Body, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Post('register')
  create(@Body() body: CreateUserDto) {
    return this.users.create(body);
  }

  @Get()
  all() {
    return this.users.findAll();
  }
}
