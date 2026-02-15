import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private dataSource: DataSource) {}

  async register(email: string, password: string) {
    const userRepo = this.dataSource.getRepository('user');
    const existing = await userRepo.findOneBy({ email });
    if (existing) throw new BadRequestException('Email já registrado');
    const hash = await bcrypt.hash(password, 10);
    const user = userRepo.create({ email, password: hash });
    await userRepo.save(user);
    return { success: true, message: 'Usuário registrado com sucesso' };
  }

  async login(email: string, password: string) {
    const userRepo = this.dataSource.getRepository('user');
    const user = await userRepo.findOneBy({ email });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');
    // Retorne um token JWT ou dados do usuário
    return { success: true, message: 'Login realizado com sucesso', user: { id: user.id, email: user.email } };
  }
}
