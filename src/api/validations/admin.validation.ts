import { z } from 'zod';
import { StudentStatus, Gender } from 'common/enums/admin.enum';

export const studentIdSchema = z.object({
    id: z.string().regex(/^\d+$/, {
        message: 'ID học sinh không hợp lệ'
    })
});

export const studentFilterSchema = z.object({
    search: z.string().optional(),
    status: z.nativeEnum(StudentStatus).optional(),
    gender: z.nativeEnum(Gender).optional(),
    school: z.string().optional(),
    page: z.string().regex(/^\d+$/, {
        message: 'Trang không hợp lệ'
    }),
    limit: z.string().regex(/^\d+$/, {
        message: 'Số lượng không hợp lệ'
    })
});

export const updateStudentStatusSchema = z.object({
    status: z.nativeEnum(StudentStatus, {
        errorMap: () => ({ message: 'Trạng thái không hợp lệ' })
    }),
    reason: z.string().optional(),
    examInfo: z.object({
        sbd: z.string().optional(),
        room: z.string().optional(),
        date: z.string().optional(),
        time: z.string().optional()
    }).optional()
});

export const updateStudentInfoSchema = z.object({
    fullName: z.string().min(1, { message: 'Họ và tên không được để trống' }).optional(),
    dateOfBirth: z.date({
        required_error: 'Ngày sinh không được để trống',
        invalid_type_error: 'Ngày sinh không hợp lệ',
    }).optional(),
    gender: z.nativeEnum(Gender, {
        errorMap: () => ({ message: 'Giới tính không hợp lệ' })
    }).optional(),
    educationDepartment: z.string().min(1, { message: 'Phòng GDĐT không được để trống' }).optional(),
    primarySchool: z.string().min(1, { message: 'Trường tiểu học không được để trống' }).optional(),
    grade: z.string().min(1, { message: 'Lớp không được để trống' }).optional(),
    placeOfBirth: z.string().min(1, { message: 'Nơi sinh không được để trống' }).optional(),
    ethnicity: z.string().min(1, { message: 'Dân tộc không được để trống' }).optional(),
    permanentAddress: z.string().min(1, { message: 'Địa chỉ thường trú không được để trống' }).optional(),
    temporaryAddress: z.string().optional(),
    currentAddress: z.string().min(1, { message: 'Địa chỉ hiện tại không được để trống' }).optional(),
    examNumber: z.string().optional(),
    examRoom: z.string().optional(),
    studentCode: z.string().optional(),
    identificationNumber: z.string().optional(),
});

export type StudentIdParam = z.infer<typeof studentIdSchema>;
export type StudentFilter = z.infer<typeof studentFilterSchema>;
export type UpdateStudentStatus = z.infer<typeof updateStudentStatusSchema>;
export type UpdateStudentInfo = z.infer<typeof updateStudentInfoSchema>; 