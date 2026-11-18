import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DeviceEntity } from '../devices/device.entity';

@Entity('readings')
@Index(['deviceId', 'recordedAt'])
export class ReadingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  deviceId: string;

  @ManyToOne(() => DeviceEntity, { onDelete: 'CASCADE' })
  device?: DeviceEntity;

  @Column({ type: 'real' })
  temperature: number;

  @Column({ type: 'real' })
  humidity: number;

  @Column({ type: 'real' })
  battery: number;

  @Column({ type: 'timestamptz' })
  recordedAt: Date;
}
