import { Subject } from '@prisma/client';

export interface SubjectRepositoryInterface {
  /**
   * Find subject by ID
   */
  findById(id: number): Promise<Subject | null>;

  /**
   * Find subject by code
   */
  findByCode(code: string): Promise<Subject | null>;

  /**
   * Get all subjects
   */
  findAll(): Promise<Subject[]>;

  /**
   * Create new subject
   */
  create(data: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subject>;

  /**
   * Update subject
   */
  update(id: number, data: Partial<Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Subject>;

  /**
   * Delete subject
   */
  delete(id: number): Promise<Subject>;

  /**
   * Find subjects by IDs
   */
  findByIds(ids: number[]): Promise<Subject[]>;

  /**
   * Find subjects by codes
   */
  findByCodes(codes: string[]): Promise<Subject[]>;
} 