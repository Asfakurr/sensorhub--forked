import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class QueryPredictionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  windowMinutes?: number;
}
