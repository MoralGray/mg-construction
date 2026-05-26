import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthResponse, LoginDto, RegisterDto } from './auth.dto.js';

@Injectable()
export class AuthService {
    constructor(
        @Inject(PrismaService) private readonly prisma: PrismaService,
        @Inject(JwtService) private readonly jwtService: JwtService
    ) {}

    async register(dto: RegisterDto): Promise<AuthResponse> {
        const existing = await this.prisma.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                name: dto.name ?? null,
            },
        });

        return this.buildResponse(user);
    }

    async login(dto: LoginDto): Promise<AuthResponse> {
        const user = await this.prisma.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.buildResponse(user);
    }

    async getProfile(userId: string) {
        const user = await this.prisma.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return null;
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            plan: user.plan,
            createdAt: user.createdAt,
        };
    }

    private buildResponse(user: { id: string; email: string; name: string | null; role: string }): AuthResponse {
        const payload = { sub: user.id, email: user.email };
        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }
}
