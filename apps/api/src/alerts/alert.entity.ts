import type { AlertKind } from '@sensorhub/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DeviceEntity } from '../devices/device.entity';

@Entity('alerts')
@Index(['deviceId', 'createdAt'])
export class AlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deviceId: string;

  @ManyToOne(() => DeviceEntity, { onDelete: 'CASCADE' })
  device?: DeviceEntity;

  @Column({ type: 'varchar' })
  kind: AlertKind;

  @Column()
  message: string;

  @Column({ type: 'real' })
  value: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
