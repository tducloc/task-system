import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';

import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";


@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async login(account: LoginDto) {
        try {

            // Get user
            const user = await this.usersService.findOneByEmail(account.email)

            // Check password
            const isMatch = await bcrypt.compare(account.password, user.password)

            if (!isMatch) {
                throw new UnauthorizedException("Your email or password is not correct!")
            }

            // Create jwt token
            const payload = {
                sub: user.id
            }

            const token = await this.jwtService.signAsync(
                payload,
            )

            return token;

        } catch (error: unknown) {
            throw error;
        }
    }
}