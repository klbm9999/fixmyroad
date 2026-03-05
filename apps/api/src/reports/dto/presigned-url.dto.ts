import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PresignedUrlDto {
  @IsString()
  @MaxLength(256)
  @IsOptional()
  filename?: string;
}
