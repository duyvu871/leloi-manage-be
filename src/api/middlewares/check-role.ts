import { Request, Response, NextFunction } from 'express';
import Forbidden from 'responses/client-errors/forbidden';
import prisma from 'repository/prisma';

/**
 * Middleware to check if user has required roles
 * @param roles Array of required roles
 */
export const checkRole = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userId;
            
            if (!userId) {
                throw new Forbidden(
                    'UNAUTHORIZED',
                    'User not authenticated',
                    'Người dùng chưa đăng nhập'
                );
            }
            
            // Get user roles from database
            const userRoles = await prisma.userRole.findMany({
                where: { userId },
                include: { role: true }
            });
            
            const userRoleNames = userRoles.map(ur => ur.role.name);
            
            // Check if user has at least one of the required roles
            const hasRequiredRole = roles.some(role => userRoleNames.includes(role));
            
            if (!hasRequiredRole) {
                throw new Forbidden(
                    'INSUFFICIENT_PERMISSIONS',
                    'User does not have the required role',
                    'Bạn không có quyền để thực hiện chức năng này'
                );
            }
            
            next();
        } catch (error) {
            next(error);
        }
    };
}; 