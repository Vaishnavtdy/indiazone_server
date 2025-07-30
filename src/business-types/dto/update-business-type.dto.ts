import { PartialType } from '@nestjs/swagger';
import { CreateBusinessTypeDto } from './create-business-type.dto';

export class UpdateBusinessTypeDto extends PartialType(CreateBusinessTypeDto) {}