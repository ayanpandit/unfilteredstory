import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty({ example: 'Breaking: Major Event Unfolds' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  title: string;

  @ApiProperty({ example: { blocks: [{ type: 'paragraph', data: { text: 'Article content...' } }] } })
  @IsNotEmpty()
  @IsObject()
  content: object;

  @ApiProperty({ example: 'A major event has unfolded today...' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  excerpt: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['uuid-tag-1', 'uuid-tag-2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
