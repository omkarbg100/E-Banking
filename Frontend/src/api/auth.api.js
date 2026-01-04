import axios from '../utils/axiosInstance'

const PORT=  "http://localhost:5000/api"

export const emailOTP = (data) => axios.post(`${PORT}/user/send-register-otp`, data)
export const verifyOTP = (data) => axios.post(`${PORT}/user/verify-register-otp`, data)
export const register = (data) => axios.post(`${PORT}/user/register`, data)


export const login = (data) => axios.post(`${PORT}/user/login`, data)

export const forgotPassword = (data) => axios.post(`${PORT}/user/forgot-password`, data);

export const resetPassword = (data) => axios.post(`${PORT}/user/reset-password`, data);