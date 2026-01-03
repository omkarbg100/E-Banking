import axios from '../utils/axiosInstance'

const PORT= meta.process.env.PORT || "http://localhost:5000/api"

export const emailOTP = (data) => axios.post(`${PORT}/user/send-register-otp`, data)
export const login = (data) => axios.post('/auth/login', data)