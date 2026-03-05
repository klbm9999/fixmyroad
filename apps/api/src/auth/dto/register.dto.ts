import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  password: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  phone?: string;

  @IsIn(['citizen', 'builder'])
  @IsOptional()
  role?: 'citizen' | 'builder' = 'citizen';
}
