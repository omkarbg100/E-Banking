import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";

import Home from "../pages/Home";
import Starting from "../pages/Starting";

import Login from "../components/Starting/Login";
import Signup from "../components/Starting/Signup";
import ForgotPassword from "../components/Starting/ForgotPassword";
import CreateAccount from "../components/Dashboard/CreateAccount";
import AccountDetails from "../components/Dashboard/AccountsDetails";


import Transaction from "../components/Transactions/Transaction";
import ScanQR from "../components/Transactions/ScanQR";
import TransactionSuccess from "../components/Transactions/TransactionSuccess";
import TransactionConversation from "../components/Transactions/TransactionConversation";

import Dashboard from "../pages/Dashboard";
import ServicesPage from "../pages/Services";
import AboutPage from "../pages/About";
import ContactPage from "../pages/Contact";
import QrPage from "../pages/QrPage";
import DeveloperPage from "../pages/DeveloperPage";
import DeveloperDocs from "../pages/DeveloperDocs";



// Admin Things
import AdminDashboard from "../pages/Admin/AdminDashboard";
import AdminLogin from "../pages/Admin/AdminLogin";



import ProtectedRoute from "./ProtectedRoute";


export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/developer-docs" element={<DeveloperDocs />} />

        {/* Auth (Nested) */}
        <Route path="/starting" element={<Starting />}>
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/accounts/create"
          element={
            <ProtectedRoute>
              <CreateAccount />
            </ProtectedRoute>
          }
        />

        {/* Account Details - Protected */}
        <Route
          path="/accounts/:accountId"
          element={
            <ProtectedRoute>
              <AccountDetails />
            </ProtectedRoute>
          }
        />

        <Route path="/scan-qr" element={<ProtectedRoute><ScanQR /></ProtectedRoute>} />
        <Route path="/qr" element={<ProtectedRoute><QrPage /></ProtectedRoute>} />

        <Route path="/transactions" element={<ProtectedRoute><Transaction /></ProtectedRoute>} />
        
        <Route path="/transactions/success" element={<ProtectedRoute><TransactionSuccess /></ProtectedRoute>} />

        <Route path="/transactions/between" element={<ProtectedRoute><TransactionConversation /></ProtectedRoute>} />


        <Route path="/developer" element={<ProtectedRoute><DeveloperPage /></ProtectedRoute>} />




        {/*     Admin Pages       */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* 404 */}
        <Route
  path="*"
  element={<Navigate to="/" replace />}
/>
      </Routes>
    </BrowserRouter>
  );
}
