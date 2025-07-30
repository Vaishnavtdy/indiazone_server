import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { 
  ValidationError, 
  UniqueConstraintError, 
  ForeignKeyConstraintError,
  DatabaseError,
} from 'sequelize';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    // Log the exception for debugging
    this.logger.error('Exception caught:', {
      message: exception.message,
      stack: exception.stack,
      url: request.url,
      method: request.method,
    });

console.log(exception)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        errors = (exceptionResponse as any).errors || null;
      }
    } else if (exception instanceof ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation error';
      errors = exception.errors.map(error => ({
        field: error.path,
        message: error.message,
        value: error.value,
      }));
    } else if (exception instanceof UniqueConstraintError) {
      status = HttpStatus.CONFLICT;
      message = 'Resource already exists';
      errors = {
        fields: exception.fields,
        details: exception.message,
      };
    } else if (exception instanceof ForeignKeyConstraintError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Foreign key constraint violation';
      errors = {
        table: exception.table,
        fields: exception.fields,
        details: exception.message,
      };
    } else if (exception instanceof DatabaseError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Database error';
      errors = {
        details: exception.message,
      };
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errors && { errors }),
    };

    response.status(status).json(errorResponse);
  }
}