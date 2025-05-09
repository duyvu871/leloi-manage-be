/**
 * @fileOverview This file defines the database seeder for initializing essential data in the database.
 * It ensures that default roles and other required data exist in the database before the application starts.
 */

import { RoleRepository } from 'repository/role.repository';
import { UserRole } from 'common/enums/models/user';
import logger from 'server/shared/utils/logger';
import { SubjectRepository } from 'repository/subject.repository';
/**
 * @class DatabaseSeeder
 * @classdesc Seeds essential data into the database during application initialization.
 */
export default class DatabaseSeeder {
    private roleRepository: RoleRepository;
    private subjectRepository: SubjectRepository;
    /**
     * @constructor
     * @description Initializes the database seeder with required repositories.
     */
    constructor() {
        this.roleRepository = new RoleRepository();
        this.subjectRepository = new SubjectRepository();
    }

    /**
     * @function initialize
     * @async
     * @description Initializes the database with essential data.
     */
    public async initialize(): Promise<void> {
        await this.seedRoles();
        await this.seedSubjects();
    }

    /**
     * @private
     * @function seedRoles
     * @async
     * @description Seeds default roles into the database if they don't exist.
     */
    private async seedRoles(): Promise<void> {
        logger.info('Seeding default roles...');
        
        // Get all roles from the UserRole enum
        const roles = Object.values(UserRole);
        
        // Create each role if it doesn't exist
        for (const roleName of roles) {
            const existingRole = await this.roleRepository.findByName(roleName);
            
            if (!existingRole) {
                logger.info(`Creating role: ${roleName}`);
                await this.roleRepository.create({
                    name: roleName
                });
            } else {
                logger.info(`Role already exists: ${roleName}`);
            }
        }
        
        logger.info('Role seeding completed.');
    }

    private async seedSubjects(): Promise<void> {
        const subjects = [
            {
              id: 1,
              name: 'Toán',
              code: 'math',
              description: 'Môn học Toán',
            },
            {
              id: 2,
              name: 'Tiếng Việt',
              code: 'vietnamese',
              description: 'Môn học Tiếng Việt',
            },
            {
              id: 3,
              name: 'Tiếng Anh',
              code: 'english',
              description: 'Môn học Tiếng Anh',
            },
            {
              id: 4,
              name: 'Khoa học',
              code: 'science',
              description: 'Môn học Khoa học',
            },
            {
              id: 5,
              name: 'Lịch sử',
              code: 'history',
              description: 'Môn học Lịch sử',
            },
          ];
        
          console.log('🌱 Seeding subjects...');
          
          for (const subject of subjects) {
            await this.subjectRepository.upsert(subject);
          }
        
          console.log('✅ Subjects seeded successfully');
    }
}