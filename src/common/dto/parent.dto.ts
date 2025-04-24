/**
 * DTO interfaces for parent-related operations
 */

/**
 * Data transfer object for student information
 */
export interface StudentDto {
	/** Student's full name */
	fullName: string;

	/** Student's date of birth */
	dateOfBirth: string;

	/** Student's gender */
	gender: 'male' | 'female' | 'other';

	/** Student's original school */
	schoolOrigin: string;
}

/**
 * Data transfer object for creating an application
 */
export interface ApplicationDto {
	/** ID of the student */
	studentId: number;
}

/**
 * Data transfer object for document upload
 */
export interface DocumentUploadDto {
	/** ID of the application */
	applicationId: number;

	/** Type of the document */
	type: 'TRANSCRIPT' | 'CERTIFICATE' | 'OTHER';
}

/**
 * Data transfer object for booking a schedule slot
 */
export interface BookScheduleDto {
	/** ID of the application */
	applicationId: number;

	/** ID of the schedule slot */
	scheduleSlotId: number;
}
