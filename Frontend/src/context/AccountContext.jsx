import React, { createContext, useContext, useState } from "react";
import { getMyAccounts } from "../api/auth.api";

const AccountContext = createContext(null);

export function AccountProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    setError(null);
    try {
      const res = await getMyAccounts(); // 🔐 JWT auto-attached
      setAccounts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load accounts");
    } finally {
      setLoadingAccounts(false);
    }
  };

  return (
    <AccountContext.Provider
      value={{
        accounts,
        setAccounts,
        fetchAccounts,
        loadingAccounts,
        error,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export const useAccounts = () => useContext(AccountContext);
export default AccountContext;

