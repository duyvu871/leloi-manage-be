import { UserRepository } from 'repository/user.repository';
import { RoleRepository } from 'repository/role.repository';
import { User, Role, ParentInfo } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from 'common/enums/models/user';
import { AuthServiceErrorMessage } from 'common/enums/auth-service-error.enum';
import { AuthServiceErrorCode } from 'common/enums/auth-service-error-code.enum';
import Conflict from 'responses/client-errors/conflict';
import NotFound from 'responses/client-errors/not-found';
import Unauthorized from 'responses/client-errors/unauthorized';
import BadRequest from 'responses/client-errors/bad-request';
import TokenService from 'services/token.service';
import appConfig from 'config/app-config';
import { RegisterDto, ProfileResponse } from 'common/dto/auth.dto';

interface TokenPayload {
    userId: number;
    username: string;
    roles: string[];
}

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export default class AuthService {
    private userRepository: UserRepository;
    private roleRepository: RoleRepository;

    private tokenService: TokenService;

    private readonly saltRounds = 10;
    private readonly accessTokenSecret = appConfig.jwtAccessSecret;
    private readonly refreshTokenSecret = appConfig.jwtRefreshSecret;
    private readonly accessTokenExpiry = appConfig.jwtAccessExpiry;
    private readonly refreshTokenExpiry = appConfig.jwtRefreshExpiry;

    constructor() {
        this.userRepository = new UserRepository();
        this.roleRepository = new RoleRepository();
        this.tokenService = new TokenService();
    }

    /**
     * Register a new user
     * @param userData User registration data
     * @returns Registered user data and auth tokens
     */
    async register(userData: RegisterDto): Promise<{ user: Partial<User>; tokens: AuthTokens }> {
        // Check if username already exists
        const existingUsername = await this.userRepository.findByEmail(userData.email);
        if (existingUsername) {
            throw new Conflict(
                AuthServiceErrorCode.EMAIL_EXISTS,
                AuthServiceErrorMessage.INVALID_CREDENTIALS,
                'Email đã tồn tại',
            );
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(userData.password, this.saltRounds);

        // Get default user role
        const userRole = await this.roleRepository.findByName(UserRole.USER);
        if (!userRole) {
            throw new NotFound(
                AuthServiceErrorCode.DEFAULT_ROLE_NOT_FOUND,
                AuthServiceErrorMessage.INVALID_CREDENTIALS,
                'Default user role not found',
            );
        }

        // Create user with transaction to ensure role assignment
        const user = await this.userRepository.transaction(async tx => {
            // Create the user
            const newUser = await tx.user.create({
                data: {
                    username: userData.fullName,
                    email: userData.email,
                    passwordHash,
                    fullName: userData.fullName,
                    phone: userData.phone,
                    address: userData.address,
                    relationship: userData.relationship,
                    termsAccepted: true,
                    userRoles: {
                        create: {
                            role: {
                                connect: { id: userRole.id },
                            },
                        },
                    },
                    userProfile: {
                        create: {
                            fullName: userData.fullName,
                        },
                    },
                    parentInfo: {
                        create: {
                            // Initialize empty parent info to be filled later
                        },
                    },
                },
            });

            return newUser;
        });

        // Get user roles
        const userWithRoles = await this.userRepository.findRolesByUserId(user.id);
        const roles = userWithRoles?.map(ur => ur.role.name) || [];

        // Generate auth tokens
        const tokens = await this.tokenService.generateAuthTokens(user.id, user.username, roles);

        // Return user data (excluding sensitive information) and tokens
        const { passwordHash: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            tokens,
        };
    }

    /**
     * Login a user
     * @param email Email
     * @param password Password
     * @returns User data and auth tokens
     */
    async login(
        email: string,
        password: string,
    ): Promise<{ user: Partial<User>; tokens: AuthTokens }> {
        // Find user by email
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new BadRequest(
                AuthServiceErrorCode.INVALID_CREDENTIALS,
                AuthServiceErrorMessage.INVALID_CREDENTIALS,
                'Tài khoản không tồn tại',
            );
        }

        // Check if user is active
        if (!user.isActive) {
            throw new BadRequest(
                AuthServiceErrorCode.ACCOUNT_DISABLED,
                AuthServiceErrorMessage.ACCOUNT_DISABLED,
                'Tài khoản đã bị khóa',
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new BadRequest(
                AuthServiceErrorCode.CURRENT_PASSWORD_INCORRECT,
                AuthServiceErrorMessage.CURRENT_PASSWORD_INCORRECT,
                'Mật khẩu không chính xác',
            );
        }

        // Get user roles
        const userWithRoles = await this.userRepository.findRolesByUserId(user.id);
        const roles = userWithRoles?.map(ur => ur.role.name) || [];

        // Generate auth tokens
        const tokens = await this.tokenService.generateAuthTokens(user.id, user.username, roles);

        // Log login activity
        await this.logUserLogin(user.id);

        // Return user data (excluding sensitive information) and tokens
        const { passwordHash: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            tokens,
        };
    }

    /**
     * Refresh access token using refresh token
     * @param refreshToken Refresh token
     * @returns New auth tokens
     */
    async refreshToken(refreshToken: string): Promise<AuthTokens> {
        if (!refreshToken) {
            throw new Unauthorized(
                AuthServiceErrorCode.REFRESH_TOKEN_REQUIRED,
                AuthServiceErrorMessage.REFRESH_TOKEN_REQUIRED,
                AuthServiceErrorMessage.REFRESH_TOKEN_REQUIRED,
            );
        }

        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, this.refreshTokenSecret) as TokenPayload;

            // Check if user exists
            const user = await this.userRepository.findById(decoded.userId);
            if (!user || !user.isActive) {
                throw new Unauthorized(
                    AuthServiceErrorCode.INVALID_REFRESH_TOKEN,
                    AuthServiceErrorMessage.INVALID_REFRESH_TOKEN,
                    AuthServiceErrorMessage.INVALID_REFRESH_TOKEN,
                );
            }

            // Generate new auth tokens
            return await this.tokenService.generateAuthTokens(user.id, user.username, decoded.roles);
        } catch (error) {
            throw new Unauthorized(
                AuthServiceErrorCode.INVALID_REFRESH_TOKEN,
                AuthServiceErrorMessage.INVALID_REFRESH_TOKEN,
                AuthServiceErrorMessage.INVALID_REFRESH_TOKEN,
            );
        }
    }

    /**
     * Logout a user
     * @param refreshToken Refresh token
     */
    async logout(refreshToken: string): Promise<void> {
        if (!refreshToken) {
            throw new BadRequest(
                AuthServiceErrorCode.REFRESH_TOKEN_REQUIRED,
                AuthServiceErrorMessage.REFRESH_TOKEN_REQUIRED,
                AuthServiceErrorMessage.REFRESH_TOKEN_REQUIRED,
            );
        }

        try {
            // Verify refresh token to get user ID
            const decoded = await this.tokenService.verifyRefreshToken(refreshToken);

            // Invalidate the refresh token with userId
            await this.tokenService.invalidateRefreshToken(
                refreshToken,
                // @ts-ignore because decoded is not a string
                decoded.payload.userId,
            );
        } catch (error) {
            // Re-throw the error for proper error handling
            throw error;
        }
    }

    /**
     * Get user profile with parent information
     * @param userId User ID
     * @returns User profile data
     */
    async getUserProfile(userId: number): Promise<ProfileResponse> {
        const user = await this.userRepository.findUserWithDetails(userId);
        if (!user) {
            throw new NotFound(AuthServiceErrorCode.USER_NOT_FOUND, 'User not found', 'User not found');
        }

        // Get user roles
        const roles = user.userRoles?.map(ur => ur.role.name) || [];

        // Determine the main role for the frontend
        const role = roles.includes('admin') ? 'admin' : 'user';

        // Build profile response with parent information
        const profileResponse: ProfileResponse = {
            id: user.id.toString(),
            email: user.email,
            fullName: user.fullName,
            phone: user.phone || '',
            address: user.address || '',
            relationship: user.relationship as 'father' | 'mother' | 'guardian' | null,
            role: role as 'user' | 'admin',
            students: (user.students || []).map(student => ({
                id: student.id,
                fullName: student.registration?.fullName || '',
                dateOfBirth: student.registration?.dateOfBirth || new Date(),
                gender: student.registration?.gender || '',
                educationDepartment: student.registration?.educationDepartment || '',
                studentCode: student.registration?.studentCode || '',
                grade: student.registration?.grade || '',
                primarySchool: student.registration?.primarySchool || '',
                placeOfBirth: student.registration?.placeOfBirth || '',
                ethnicity: student.registration?.ethnicity || '',
                permanentAddress: student.registration?.permanentAddress || '',
                currentAddress: student.registration?.currentAddress || '',
                application: student.application ? {
                    ...student.application,
                    ApplicationDocuments: []
                } : null
            })),
            parentInfo: user.parentInfo
                ? {
                    ...user.parentInfo,
                }
                : null,
        };

        return profileResponse;
    }

    /**
     * Update parent information
     * @param userId User ID
     * @param parentInfo Parent information data
     */
    async updateParentInfo(userId: number, parentInfo: Partial<ParentInfo>): Promise<void> {
        // Check if user exists
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFound(AuthServiceErrorCode.USER_NOT_FOUND, 'User not found', 'User not found');
        }

        // Update or create parent info
        await this.userRepository.transaction(async tx => {
            // Check if parent info exists
            const existingParentInfo = await tx.parentInfo.findUnique({
                where: { userId },
            });

            if (existingParentInfo) {
                // Update existing parent info
                await tx.parentInfo.update({
                    where: { userId },
                    data: {
                        ...parentInfo,
                        updatedAt: new Date(),
                    },
                });
            } else {
                // Create new parent info
                await tx.parentInfo.create({
                    data: {
                        ...parentInfo,
                        userId,
                    },
                });
            }
        });
    }

    /**
     * Change user password
     * @param userId User ID
     * @param currentPassword Current password
     * @param newPassword New password
     */
    async changePassword(
        userId: number,
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        // Validate inputs
        if (!currentPassword) {
            throw new BadRequest(
                AuthServiceErrorCode.CURRENT_PASSWORD_REQUIRED,
                AuthServiceErrorMessage.CURRENT_PASSWORD_REQUIRED,
                AuthServiceErrorMessage.CURRENT_PASSWORD_REQUIRED,
            );
        }

        if (!newPassword) {
            throw new BadRequest(
                AuthServiceErrorCode.NEW_PASSWORD_REQUIRED,
                AuthServiceErrorMessage.NEW_PASSWORD_REQUIRED,
                AuthServiceErrorMessage.NEW_PASSWORD_REQUIRED,
            );
        }

        if (currentPassword === newPassword) {
            throw new BadRequest(
                AuthServiceErrorCode.PASSWORDS_MATCH,
                AuthServiceErrorMessage.PASSWORDS_MATCH,
                AuthServiceErrorMessage.PASSWORDS_MATCH,
            );
        }

        // Find user
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFound(AuthServiceErrorCode.USER_NOT_FOUND, 'User not found', 'User not found');
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new Unauthorized(
                AuthServiceErrorCode.CURRENT_PASSWORD_INCORRECT,
                AuthServiceErrorMessage.CURRENT_PASSWORD_INCORRECT,
                AuthServiceErrorMessage.CURRENT_PASSWORD_INCORRECT,
            );
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

        // Update user password
        await this.userRepository.update(userId, { passwordHash });
    }

    /**
     * Reset password with token
     * @param token Reset token
     * @param newPassword New password
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        if (!token) {
            throw new BadRequest(
                AuthServiceErrorCode.RESET_TOKEN_REQUIRED,
                AuthServiceErrorMessage.RESET_TOKEN_REQUIRED,
                AuthServiceErrorMessage.RESET_TOKEN_REQUIRED,
            );
        }

        if (!newPassword) {
            throw new BadRequest(
                AuthServiceErrorCode.NEW_PASSWORD_REQUIRED,
                AuthServiceErrorMessage.NEW_PASSWORD_REQUIRED,
                AuthServiceErrorMessage.NEW_PASSWORD_REQUIRED,
            );
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, this.accessTokenSecret) as { userId: number };

            // Find user
            const user = await this.userRepository.findById(decoded.userId);
            if (!user || !user.isActive) {
                throw new Unauthorized(
                    AuthServiceErrorCode.INVALID_RESET_TOKEN,
                    AuthServiceErrorMessage.INVALID_RESET_TOKEN,
                    AuthServiceErrorMessage.INVALID_RESET_TOKEN,
                );
            }

            // Hash new password
            const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

            // Update user password
            await this.userRepository.update(user.id, { passwordHash });
        } catch (error) {
            throw new Unauthorized(
                AuthServiceErrorCode.INVALID_RESET_TOKEN,
                AuthServiceErrorMessage.INVALID_RESET_TOKEN,
                AuthServiceErrorMessage.INVALID_RESET_TOKEN,
            );
        }
    }

    /**
     * Request password reset
     * @param email User email
     */
    async requestPasswordReset(email: string): Promise<void> {
        if (!email) {
            throw new BadRequest(
                AuthServiceErrorCode.EMAIL_REQUIRED,
                'Email is required',
                'Email is required',
            );
        }

        // Find user by email
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            // Don't reveal that the email doesn't exist for security reasons
            return;
        }

        // In a real implementation, you would:
        // 1. Generate a password reset token
        // 2. Store it in the database with an expiry time
        // 3. Send an email to the user with a link containing the token

        // This is a simplified implementation
        const resetToken = jwt.sign({ userId: user.id }, this.accessTokenSecret, { expiresIn: '1h' });

        // Here you would send an email with the reset token
        console.log(`Password reset token for ${email}: ${resetToken}`);
    }

    /**
     * Log user login activity
     * @param userId User ID
     * @private
     */
    private async logUserLogin(userId: number): Promise<void> {
        // In a real implementation, you would log the login activity
        // For example, by creating a record in the LoginLog table
        // This is a simplified implementation
        console.log(`User ${userId} logged in at ${new Date().toISOString()}`);
    }
}
