import { ErrorMessage } from "common/types";

class Unauthorized extends Error {
    public readonly statusCode: number = 401;

    constructor(
        public errorCode: string,
        public errorDescription: string,
        public errorMessage: ErrorMessage,
    ) {
        super();

        this.statusCode = this.statusCode;
        this.errorCode = errorCode;
        this.errorDescription = errorDescription;
        this.errorMessage = errorMessage;
    }
}

export default Unauthorized;