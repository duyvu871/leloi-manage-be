/**
 * DTO interfaces for manager-related operations
 */

/**
 * Data transfer object for creating a schedule
 */
export interface ScheduleDto {
	/** Schedule title */
	title: string;

	/** Schedule description */
	description?: string;

	/** Schedule start date */
	startDate: string;

	/** Schedule end date */
	endDate: string;
}

/**
 * Data transfer object for creating schedule slots
 */
export interface ScheduleSlotDto {
	/** Slot start time */
	startTime: string;

	/** Slot end time */
	endTime: string;

	/** Maximum number of applications that can be booked in this slot */
	capacity: number;
}

/**
 * Data transfer object for filtering applications
 */
export interface ApplicationFilterDto {
	/** Search term for filtering applications */
	search?: string;

	/** Filter by application status */
	status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITING_VERIFICATION';

	/** Filter by start date */
	fromDate?: string;

	/** Filter by end date */
	toDate?: string;
}

/**
 * Data transfer object for verifying an application
 */
export interface VerifyApplicationDto {
	/** Whether the application is verified */
	isVerified: boolean;

	/** Reason for rejection if application is not verified */
	rejectionReason?: string;
}

/**
 * Data transfer object for assigning exam details
 */
export interface AssignExamDto {
	/** Exam number assigned to the student */
	examNumber: string;

	/** Exam room assigned to the student */
	examRoom: string;
}
