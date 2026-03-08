import { IsNotEmpty, IsString, IsEmail, IsEnum, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'janedoe' })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  username: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: Role })
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}
