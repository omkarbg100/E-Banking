import axios from "axios";

const BASE_URL = "http://localhost:5000/api";
//const BASE_URL = import.meta.env.VITE_API_BASE_URL;


/* ================= TOKEN HELPER ================= */
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

/* ================= AUTH ================= */
export const emailOTP = (data) =>
  axios.post(`${BASE_URL}/user/send-register-otp`, data);

export const verifyOTP = (data) =>
  axios.post(`${BASE_URL}/user/verify-register-otp`, data);

export const register = (data) =>
  axios.post(`${BASE_URL}/user/register`, data);

export const login = (data) =>
  axios.post(`${BASE_URL}/user/login`, data);

export const forgotPassword = (data) =>
  axios.post(`${BASE_URL}/user/forgot-password`, data);

export const resetPassword = (data) =>
  axios.post(`${BASE_URL}/user/reset-password`, data);

// Logged-in user reset password
export const resetPasswordLoggedIn = (data) =>
  axios.post(
    `${BASE_URL}/user/reset-password-logged-in`,
    data,
    getAuthHeaders()
  );

/* ================= ACCOUNTS ================= */
export const getMyAccounts = () =>
  axios.get(
    `${BASE_URL}/accounts/me/accountLists`,
    getAuthHeaders()
  );

export const createAccount = (data) =>
  axios.post(
    `${BASE_URL}/accounts/create`,
    data,
    getAuthHeaders()
  );

/* ================= TRANSACTIONS ================= */
export const transferMoney = (data) =>
  axios.post(
    `${BASE_URL}/transactions/transfer`,
    data,
    getAuthHeaders()
  );

export const getMyTransactions = () =>
  axios.get(
    `${BASE_URL}/transactions/me`,
    getAuthHeaders()
  );

export const getRecentTransactionAccounts = () =>
  axios.get(`${BASE_URL}/transactions/recent-accounts`, getAuthHeaders());


export const getTransactionsBetweenAccounts = (toAccount) =>
  axios.get(`${BASE_URL}/transactions/between`, {
    params: {toAccount},
    ...getAuthHeaders(), // <- spread the headers object here
  });




 
// get logged-in developer account
export const getMyDeveloperAccount = () =>
  axios.get(`${BASE_URL}/developer/me`, getAuthHeaders());

// create developer account
export const createDeveloperAccount = (data) =>
  axios.post(`${BASE_URL}/developer/create`, data, getAuthHeaders());
