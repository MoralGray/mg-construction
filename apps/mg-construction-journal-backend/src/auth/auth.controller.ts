import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Controller('api/auth')
export class AuthController {
    constructor(@Inject(AuthService) private readonly authService: AuthService) {}

    @Post('register')
    register(@Body() dto: { email: string; password: string; name?: string }) {
        return this.authService.register(dto);
    }

    @Post('login')
    login(@Body() dto: { email: string; password: string }) {
        return this.authService.login(dto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    me(@CurrentUser() user: { id: string }) {
        return this.authService.getProfile(user.id);
    }
}
