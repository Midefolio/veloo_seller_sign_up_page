const baseUrl = "http://localhost:4000/api/v1";

const EMAIL_VERIFY_OTP_API = `${baseUrl}/sellers/auth/verify_email_otp`;
const EMAIL_SIGNUP_API = `${baseUrl}/sellers/auth/register_email`;

export {
    EMAIL_SIGNUP_API,
    EMAIL_VERIFY_OTP_API,
};
