import { PrismaClient, Subject } from '@prisma/client';
import { SubjectRepositoryInterface } from 'server/common/interfaces/subject.repository.interface';
import logger from 'util/logger';
import prisma from 'repository/prisma';

export class SubjectRepository implements SubjectRepositoryInterface {
    private prisma: PrismaClient;
    constructor() {
        this.prisma = prisma;
    }

  async findById(id: number): Promise<Subject | null> {
    try {
      return await this.prisma.subject.findUnique({
        where: { id }
      });
    } catch (error) {
      logger.error('Error in SubjectRepository.findById:', error);
      throw error;
    }
  }

  async findByCode(code: string): Promise<Subject | null> {
    try {
      return await this.prisma.subject.findFirst({
        where: { code }
      });
    } catch (error) {
      logger.error('Error in SubjectRepository.findByCode:', error);
      throw error;
    }
  }

  async findAll(): Promise<Subject[]> {
    try {
      return await this.prisma.subject.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      logger.error('Error in SubjectRepository.findAll:', error);
      throw error;
    }
  }

  async create(data: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subject> {
    try {
      return await this.prisma.subject.create({
        data
      });
    } catch (error) {
      logger.error('Error in SubjectRepository.create:', error);
      throw error;
    }
  }

  async upsert(data: Omit<Subject, 'createdAt' | 'updatedAt'>): Promise<Subject> {
    try {
      return await this.prisma.subject.upsert({
        where: { id: data.id },
        update: data,
        create: data
      });
    } catch (error) {
      logger.error('Error in SubjectRepository.upsert:', error);
      throw error;
    }
  }

  async update(
    id: number,
    data: Partial<Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Subject> {
    try {
      return await this.prisma.subject.update({
        where: { id },
        data
      });
    } catch (error) {
      logger.error('Error in SubjectRepository.update:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<Subject> {
    try {
      return await this.prisma.subject.delete({
        where: { id }
      });
    } catch (error) {
      logger.error('Error in SubjectRepository.delete:', error);
      throw error;
    }
  }

  async findByIds(ids: number[]): Promise<Subject[]> {
    try {
      return await this.prisma.subject.findMany({
        where: {
          id: {
            in: ids
          }
        },
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      logger.error('Error in SubjectRepository.findByIds:', error);
      throw error;
    }
  }

  async findByCodes(codes: string[]): Promise<Subject[]> {
    try {
      return await this.prisma.subject.findMany({
        where: {
          code: {
            in: codes
          }
        },
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      logger.error('Error in SubjectRepository.findByCodes:', error);
      throw error;
    }
  }
} 