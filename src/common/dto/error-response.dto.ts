import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'HTTP status code',
    example: 409,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Timestamp of the error',
    example: '2024-01-01T12:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path',
    example: '/api/users',
  })
  path: string;

  @ApiProperty({
    description: 'HTTP method',
    example: 'POST',
  })
  method: string;

  @ApiProperty({
    description: 'Error message',
    example: 'User with this email already exists',
  })
  message: string;

  @ApiProperty({
    description: 'Additional error details',
    required: false,
    example: {
      field: 'email',
      value: 'user@example.com',
    },
  })
  errors?: any;
}