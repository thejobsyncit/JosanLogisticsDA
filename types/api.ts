export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export class ApiRequestError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiRequestError";
    this.status = error.status;
    this.code = error.code;
    this.fieldErrors = error.fieldErrors;
  }
}

export interface LoginRequest {
  email?: string;
  employeeIdOrPhone?: string;
  password: string;
}

export interface LoginResponse {
  driverId: string;
  requiresOtp: boolean;
  otpChallengeToken?: string;
  token?: string;
  refreshToken?: string;
}

export interface VerifyOtpRequest {
  otpChallengeToken: string;
  code: string;
}

export interface VerifyOtpResponse {
  token: string;
  refreshToken: string;
}
