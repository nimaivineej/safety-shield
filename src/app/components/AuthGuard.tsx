import { Navigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

interface AuthGuardProps {
    children?: React.ReactNode;
    requiredRole?: string;
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login-selection" replace />;
    }

    if (requiredRole) {
        const user = authService.getCurrentUser();
        const role = user?.role;

        // Special case: USER and VOLUNTEER are interchangeable for volunteer routes
        const isVolunteerRoute = requiredRole === 'VOLUNTEER';
        const hasAccess = role === requiredRole || (isVolunteerRoute && role === 'USER');

        if (!hasAccess) {
            return <Navigate to="/home" replace />;
        }
    }

    return <>{children}</>;
}
