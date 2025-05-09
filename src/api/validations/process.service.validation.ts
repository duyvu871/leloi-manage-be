import { ValidationStatus } from "server/common/enums/services/document-process.enum";
import { z } from "zod";

export class ProcessServiceValidation {
    public static transcript = z.object({
        ten: z.string(),
        monHoc: z.array(z.object({
            mon: z.string({ message: `${ValidationStatus.INVALID}:mon` }),
            muc: z.enum(['T', 'H'], { message: `${ValidationStatus.INVALID}:muc-diem` }),
            diem: z.number({ message: `${ValidationStatus.INVALID}:diem` }).nullable(),
        })),
        phamChat: z.record(z.string(), z.string({ message: `${ValidationStatus.INVALID}:pham-chat` })),
        nangLuc: z.record(z.string(), z.string({ message: `${ValidationStatus.INVALID}:nang-luc` })),
    });
}
