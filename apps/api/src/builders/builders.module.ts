import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ClaimsModule } from '../claims/claims.module';
import { BuildersController } from './builders.controller';
import { BuildersService } from './builders.service';
import { Builder } from './entities/builder.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Builder]),
    AuthModule,
    ClaimsModule,
  ],
  controllers: [BuildersController],
  providers: [BuildersService],
  exports: [BuildersService],
})
export class BuildersModule {}
