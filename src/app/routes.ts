import { createBrowserRouter } from "react-router-dom";
import { createElement } from "react";
import { SplashScreen } from "./components/SplashScreen";
import { LoginScreen } from "./components/LoginScreen";
import { LoginSelectionScreen } from "./components/LoginSelectionScreen";
import { RegisterScreen } from "./components/RegisterScreen";
import { VolunteerRegisterScreen } from "./components/VolunteerRegisterScreen";
import { VolunteerLoginScreen } from "./components/VolunteerLoginScreen";
import { HomeScreen } from "./components/HomeScreen";
import { SOSAlertScreen } from "./components/SOSAlertScreen";
import { EmergencyContactsScreen } from "./components/EmergencyContactsScreen";
import { IncidentReportScreen } from "./components/IncidentReportScreen";
import { SafeRouteMapScreen } from "./components/SafeRouteMapScreen";
import { VolunteerScreen } from "./components/VolunteerScreen";
import { VolunteerDashboard } from "./components/VolunteerDashboard";
import { VolunteerIncidentDetails } from "./components/VolunteerIncidentDetails";
import { ProfileScreen } from "./components/ProfileScreen";
import { InsuranceContactScreen } from "./components/InsuranceContactScreen";
import { VolunteerMapScreen } from "./components/VolunteerMapScreen";
import { VolunteerProfileScreen } from "./components/VolunteerProfileScreen";
import { ForgotPasswordScreen } from "./components/ForgotPasswordScreen";
import { ResetPasswordScreen } from "./components/ResetPasswordScreen";
import { AdminDashboard } from "./components/AdminDashboard";
import { AuthGuard } from "./components/AuthGuard";
import { NotificationsScreen } from "./components/NotificationsScreen";
import { PrivacySecurityScreen } from "./components/PrivacySecurityScreen";
import { LocationSettingsScreen } from "./components/LocationSettingsScreen";
import { SafetyPreferencesScreen } from "./components/SafetyPreferencesScreen";
import { HelpSupportScreen } from "./components/HelpSupportScreen";
import { AlertsScreen } from "./components/AlertsScreen";

// Helper to wrap a component with AuthGuard
function guarded(Component: React.ComponentType, requiredRole?: string) {
  return () => createElement(AuthGuard, { requiredRole }, createElement(Component));
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: SplashScreen,
  },
  {
    path: "/login-selection",
    Component: LoginSelectionScreen,
  },
  {
    path: "/login",
    Component: LoginScreen,
  },
  {
    path: "/volunteer-login",
    Component: VolunteerLoginScreen,
  },
  {
    path: "/forgot-password",
    Component: ForgotPasswordScreen,
  },
  {
    path: "/reset-password",
    Component: ResetPasswordScreen,
  },
  {
    path: "/register",
    Component: RegisterScreen,
  },
  {
    path: "/volunteer-register",
    Component: VolunteerRegisterScreen,
  },
  // Protected routes
  {
    path: "/home",
    Component: guarded(HomeScreen),
  },
  {
    path: "/sos-alert",
    Component: guarded(SOSAlertScreen),
  },
  {
    path: "/emergency-contacts",
    Component: guarded(EmergencyContactsScreen),
  },
  {
    path: "/report-incident",
    Component: guarded(IncidentReportScreen),
  },
  {
    path: "/safe-route",
    Component: guarded(SafeRouteMapScreen),
  },
  {
    path: "/volunteer",
    Component: guarded(VolunteerScreen),
  },
  {
    path: "/profile",
    Component: guarded(ProfileScreen),
  },
  // Settings pages
  {
    path: "/notifications",
    Component: guarded(NotificationsScreen),
  },
  {
    path: "/privacy-security",
    Component: guarded(PrivacySecurityScreen),
  },
  {
    path: "/location-settings",
    Component: guarded(LocationSettingsScreen),
  },
  {
    path: "/safety-preferences",
    Component: guarded(SafetyPreferencesScreen),
  },
  {
    path: "/help-support",
    Component: guarded(HelpSupportScreen),
  },
  {
    path: "/alerts",
    Component: guarded(AlertsScreen),
  },
  {
    path: "/volunteer-dashboard",
    Component: guarded(VolunteerDashboard, 'VOLUNTEER'),
  },
  {
    path: "/volunteer/incident/:id",
    Component: guarded(VolunteerIncidentDetails, 'VOLUNTEER'),
  },
  {
    path: "/insurance-contact",
    Component: guarded(InsuranceContactScreen),
  },
  {
    path: "/volunteer-map",
    Component: guarded(VolunteerMapScreen, 'VOLUNTEER'),
  },
  {
    path: "/volunteer-profile",
    Component: guarded(VolunteerProfileScreen, 'VOLUNTEER'),
  },
  {
    path: "/admin-dashboard",
    Component: guarded(AdminDashboard, 'ADMIN'),
  },
]);
