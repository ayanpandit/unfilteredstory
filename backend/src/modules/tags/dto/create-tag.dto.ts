import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'Breaking News' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  name: string;
}
