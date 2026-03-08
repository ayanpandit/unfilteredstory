import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateArticleDto {
  @ApiPropertyOptional({ example: 'Updated Title' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  content?: object;

  @ApiPropertyOptional({ example: 'Updated excerpt...' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiPropertyOptional({ example: 'https://example.com/new-image.jpg' })
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['uuid-tag-1', 'uuid-tag-2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
