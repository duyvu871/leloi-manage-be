import { z } from 'zod';

// Regex cho số điện thoại Việt Nam
const phoneRegex = /^(0|\+84)(\d{9,10})$/;

// Schema cho đăng ký tài khoản phụ huynh/người giám hộ
export const parentRegistrationSchema = z
  .object({
    fullName: z.string().min(2, { message: 'Họ và tên phải chứa ít nhất 2 ký tự' }),
    email: z.string().email({ message: 'Email không hợp lệ' }),
    password: z.string().min(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự' }),
    confirmPassword: z.string().min(6, { message: 'Xác nhận mật khẩu phải chứa ít nhất 6 ký tự' }),
    phone: z.string().regex(phoneRegex, {
      message: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam hợp lệ',
    }),
    address: z.string().min(5, { message: 'Địa chỉ phải chứa ít nhất 5 ký tự' }),
    relationship: z.enum(['father', 'mother', 'guardian'], {
      errorMap: () => ({ message: 'Vui lòng chọn mối quan hệ với học sinh' }),
    }),
    terms: z.boolean().refine(val => val === true, {
      message: 'Bạn phải đồng ý với các điều khoản và điều kiện',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Mật khẩu và xác nhận mật khẩu không khớp',
    path: ['confirmPassword'],
  });

// Schema cho đăng ký thông tin học sinh
export const studentRegistrationSchema = z.object({
  // A. Student Information
  studentInfo: z.object({
    educationDepartment: z.string().min(1, { message: 'Phòng GDĐT không được để trống' }),
    primarySchool: z.string().min(1, { message: 'Trường tiểu học không được để trống' }),
    grade: z.string().min(1, { message: 'Lớp không được để trống' }),
    gender: z.enum(['male', 'female'], { message: 'Vui lòng chọn giới tính' }),
    fullName: z.string().min(1, { message: 'Họ và tên học sinh không được để trống' }),
    dateOfBirth: z.date({
      required_error: 'Ngày sinh không được để trống',
      invalid_type_error: 'Ngày sinh không hợp lệ',
    }),
    placeOfBirth: z.string().min(1, { message: 'Nơi sinh không được để trống' }),
    ethnicity: z.string().min(1, { message: 'Dân tộc không được để trống' }),
  }),

  // B. Residence Information
  residenceInfo: z.object({
    permanentAddress: z.string().min(1, { message: 'Địa chỉ thường trú không được để trống' }),
    temporaryAddress: z.string().optional(),
    currentAddress: z.string().min(1, { message: 'Địa chỉ hiện tại không được để trống' }),
  }),

  // Các phần khác được giữ nguyên như schema gốc...
});

// Schema cho đăng ký thông tin phụ huynh chi tiết 
export const parentInfoSchema = z
  .object({
    // Father
    fatherName: z.string().optional(),
    fatherBirthYear: z.number().int().positive().optional(),
    fatherPhone: z.string().regex(phoneRegex, { message: 'Số điện thoại không hợp lệ' }).optional(),
    fatherIdCard: z.string().optional(),
    fatherOccupation: z.string().optional(),
    fatherWorkplace: z.string().optional(),

    // Mother
    motherName: z.string().optional(),
    motherBirthYear: z.number().int().positive().optional(),
    motherPhone: z.string().regex(phoneRegex, { message: 'Số điện thoại không hợp lệ' }).optional(),
    motherIdCard: z.string().optional(),
    motherOccupation: z.string().optional(),
    motherWorkplace: z.string().optional(),

    // Guardian (người giám hộ)
    guardianName: z.string().optional(),
    guardianBirthYear: z.number().int().positive().optional(),
    guardianPhone: z.string().regex(phoneRegex, { message: 'Số điện thoại không hợp lệ' }).optional(),
    guardianIdCard: z.string().optional(),
    guardianOccupation: z.string().optional(),
    guardianWorkplace: z.string().optional(),
    guardianRelationship: z.string().optional(),
  })
  .refine(
    (data) => {
      // Đảm bảo ít nhất một trong ba: cha, mẹ hoặc người giám hộ có thông tin
      return (
        (!!data.fatherName && !!data.fatherPhone) ||
        (!!data.motherName && !!data.motherPhone) ||
        (!!data.guardianName && !!data.guardianPhone)
      );
    },
    {
      message:
        'Vui lòng cung cấp thông tin của ít nhất một trong ba: Cha, Mẹ hoặc Người giám hộ (bao gồm họ tên và số điện thoại)',
      path: ['_errors'],
    }
  );

// Schema cho đăng ký đầy đủ kết hợp thông tin cơ bản và chi tiết
export const completeRegistrationSchema = z.object({
  basicInfo: parentRegistrationSchema,
  parentInfo: parentInfoSchema.optional()
});

// Schema cho điểm số học tập
const academicGradeSchema = z.object({
  grade: z.number().int().min(1).max(12),
  math: z.number().min(0).max(10),
  vietnamese: z.number().min(0).max(10),
  english: z.number().min(0).max(10).optional(),
  science: z.number().min(0).max(10).optional(),
  history: z.number().min(0).max(10).optional(),
});

// Schema cho kết quả thi đấu/cuộc thi
const competitionResultSchema = z.object({
  competitionId: z.string(),
  level: z.string(),
  year: z.number().int(),
  achievement: z.string(),
});

// Schema cho API đăng ký
export const registrationApiSchema = z.object({
  // A. Thông tin học tập
  academicRecords: z.object({
    grades: z.array(academicGradeSchema)
  }),

  // B. Thông tin học sinh
  studentInfo: z.object({
    fullName: z.string().min(1, { message: 'Họ và tên học sinh không được để trống' }),
    dateOfBirth: z.string().datetime({
      message: 'Ngày sinh không hợp lệ',
    }),
    gender: z.enum(['male', 'female'], { message: 'Vui lòng chọn giới tính' }),
    educationDepartment: z.string().min(1, { message: 'Phòng GDĐT không được để trống' }),
    primarySchool: z.string().min(1, { message: 'Trường tiểu học không được để trống' }),
    grade: z.string().min(1, { message: 'Lớp không được để trống' }),
    placeOfBirth: z.string().min(1, { message: 'Nơi sinh không được để trống' }),
    ethnicity: z.string().min(1, { message: 'Dân tộc không được để trống' }),
  }),

  // C. Thông tin phụ huynh
  parentInfo: parentInfoSchema,

  // D. Thông tin cư trú
  residenceInfo: z.object({
    permanentAddress: z.string().min(1, { message: 'Địa chỉ thường trú không được để trống' }),
    temporaryAddress: z.string().optional(),
    currentAddress: z.string().min(1, { message: 'Địa chỉ hiện tại không được để trống' }),
  }),

  // E. Cam kết
  commitment: z.object({
    relationship: z.string().min(1, { message: 'Mối quan hệ không được để trống' }),
    signatureDate: z.string().datetime({
      message: 'Ngày ký không hợp lệ',
    }),
    guardianName: z.string().min(1, { message: 'Tên người giám hộ không được để trống' }),
    applicantName: z.string().min(1, { message: 'Tên người đăng ký không được để trống' }),
  }).optional(),

  // F. Kết quả thi đấu/cuộc thi
  competitionResults: z.array(competitionResultSchema).optional(),
});

export const studentIdParam = z.object({
  studentId: z.string().regex(/^\d+$/, {
    message: 'ID học sinh không hợp lệ',
  })
});

export type ParentRegistrationData = z.infer<typeof parentRegistrationSchema>;
export type StudentRegistrationData = z.infer<typeof studentRegistrationSchema>;
export type ParentInfoData = z.infer<typeof parentInfoSchema>;
export type CompleteRegistrationData = z.infer<typeof completeRegistrationSchema>;
export type RegistrationApiData = z.infer<typeof registrationApiSchema>;
export type StudentIdParam = z.infer<typeof studentIdParam>;