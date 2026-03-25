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
        if (user?.role !== requiredRole) {
            return <Navigate to="/home" replace />;
        }
    }

    return <>{children}</>;
}
