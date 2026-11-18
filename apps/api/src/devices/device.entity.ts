import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('devices')
export class DeviceEntity {
  /** Hardware id reported by the device, e.g. "dev-001". */
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ default: 'env-sensor' })
  type: string;

  @Column({ type: 'real', nullable: true })
  battery: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  firstSeen: Date;

  @Column({ type: 'timestamptz' })
  lastSeen: Date;
}
