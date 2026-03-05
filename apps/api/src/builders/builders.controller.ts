import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { BuildersService } from './builders.service';

@Controller('builders')
export class BuildersController {
  constructor(private readonly builders: BuildersService) {}

  @Post('register')
  @UseGuards(AuthGuard('jwt'))
  register(@CurrentUser() user: User, @Body() body: { businessName?: string; registrationNumber?: string }) {
    return this.builders.register(user.id, body);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@CurrentUser() user: User) {
    return this.builders.getMe(user.id);
  }

  @Post('claims')
  @UseGuards(AuthGuard('jwt'))
  claim(@CurrentUser() user: User, @Body() body: { issueId: string; bondAmount: number }) {
    return this.builders.claimIssue(user.id, body.issueId, body.bondAmount);
  }

  @Get('claims')
  @UseGuards(AuthGuard('jwt'))
  myClaims(@CurrentUser() user: User) {
    return this.builders.getMyClaims(user.id);
  }

  @Post('claims/:id/fix')
  @UseGuards(AuthGuard('jwt'))
  submitFix(
    @Param('id') claimId: string,
    @CurrentUser() user: User,
    @Body() body: { afterPhotoUrl: string; beforePhotoUrl?: string; proofAt: string },
  ) {
    return this.builders.submitFix(claimId, user.id, body);
  }

  @Post('claims/:id/cancel')
  @UseGuards(AuthGuard('jwt'))
  cancelClaim(@Param('id') claimId: string, @CurrentUser() user: User) {
    return this.builders.cancelClaim(claimId, user.id);
  }
}
