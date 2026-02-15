import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Post('firebase')
  async firebaseLogin(@Body() body: { idToken: string }) {
    const firebaseUser = await this.firebaseService.verifyIdToken(body.idToken);
    // Aqui você pode criar o usuário no banco se não existir, ou retornar dados
    return { success: true, firebaseUser };
  }

  @Post('register')
  async register(@Body() body: { email: string; password: string }) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

}
