import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import env from '../config/env';
import { Team, User, sequelize } from '../models';
import type { AuthenticatedUser } from '../types/task';
import AppError from '../utils/app-error';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  teamName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: AuthenticatedUser;
  token: string;
}

export default class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const normalizedEmail = input.email.toLowerCase().trim();

    return sequelize.transaction(async (transaction) => {
      const existingUser = await User.findOne({ where: { email: normalizedEmail }, transaction });
      if (existingUser) throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'Email already registered');

      const teamName = input.teamName.trim();
      const [team] = await Team.findOrCreate({
        where: { name: teamName },
        defaults: { name: teamName },
        transaction
      });

      const passwordHash = await bcrypt.hash(input.password, env.bcryptSaltRounds);
      const user = await User.create(
        {
          name: input.name,
          email: normalizedEmail,
          passwordHash,
          teamId: team.id
        },
        { transaction }
      );

      const publicUser = user.toPublicJSON();
      return {
        user: publicUser,
        token: this.signToken(publicUser)
      };
    });
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await User.findOne({ where: { email: input.email.toLowerCase().trim() } });
    if (!user) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

    const publicUser = user.toPublicJSON();
    return {
      user: publicUser,
      token: this.signToken(publicUser)
    };
  }

  private signToken(user: AuthenticatedUser): string {
    const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] };
    return jwt.sign({ sub: user.id, email: user.email, teamId: user.teamId }, env.jwtSecret, options);
  }
}
