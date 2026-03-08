import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Technology' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Articles about technology and innovation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
