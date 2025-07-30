import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { 
  ValidationError, 
  UniqueConstraintError, 
  ForeignKeyConstraintError,
  DatabaseError,
} from 'sequelize';

@Catch(ValidationError, UniqueConstraintError, ForeignKeyConstraintError, DatabaseError)
export class SequelizeExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.BAD_REQUEST;
    let message = 'Database error';
    let errors: any = {};

    if (exception instanceof ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation error';
      errors = exception.errors.map(error => ({
        field: error.path,
        message: error.message,
        value: error.value,
      }));
    } else if (exception instanceof UniqueConstraintError) {
      status = HttpStatus.CONFLICT;
      message = 'Unique constraint violation';
      errors = {
        fields: exception.fields,
        message: exception.message,
      };
    } else if (exception instanceof ForeignKeyConstraintError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Foreign key constraint violation';
      errors = {
        table: exception.table,
        fields: exception.fields,
        message: exception.message,
      };
    } else if (exception instanceof DatabaseError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Database error';
      errors = {
        message: exception.message,
        sql: exception.sql,
      };
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      errors,
    });
  }
}