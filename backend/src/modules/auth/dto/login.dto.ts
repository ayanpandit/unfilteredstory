import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'StrongP@ssw0rd' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
