import type { CreateReadingInput } from '@sensorhub/shared';
import { IsISO8601, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReadingDto implements CreateReadingInput {
  @IsString()
  deviceId: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsNumber()
  @Min(-50)
  @Max(150)
  temperature: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  humidity: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  battery: number;

  @IsOptional()
  @IsISO8601()
  recordedAt?: string;
}
