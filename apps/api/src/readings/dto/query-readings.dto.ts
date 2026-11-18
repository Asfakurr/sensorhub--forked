import { Type } from 'class-transformer';
import { IsISO8601, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryReadingsDto {
  @IsOptional()
  @IsString()
  deviceId?: string;

  /** Only readings recorded at or after this ISO timestamp. */
  @IsOptional()
  @IsISO8601()
  since?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  limit?: number;
}
