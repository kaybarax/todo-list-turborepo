import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { UserService } from './user.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: { id: string }) {
    const profile = await this.userService.findById(user.id);
    return {
      id: profile._id,
      email: profile.email,
      name: profile.name,
      walletAddress: profile.walletAddress,
      preferredNetwork: profile.preferredNetwork,
      settings: profile.settings,
      isVerified: profile.isVerified,
      isActive: profile.isActive,
      lastLoginAt: profile.lastLoginAt,
    };
  }
}
