import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum SummaryStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (user) => user.documents)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 255 })
  mayanDocumentId: string;

  @Column({ length: 500 })
  filename: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ length: 100 })
  mimeType: string;

  @Column({ type: 'text', nullable: true })
  summaryText: string;

  @Column({ type: 'jsonb', nullable: true })
  keyPoints: string[];

  @Column({ type: 'jsonb', nullable: true })
  keywords: string[];

  @Column({ type: 'enum', enum: SummaryStatus, default: SummaryStatus.PENDING })
  summaryStatus: SummaryStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

