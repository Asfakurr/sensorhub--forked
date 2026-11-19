import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryPredictionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(5000)
  limit?: number;
}
