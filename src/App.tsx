import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Admin from "./pages/Admin.tsx";
import Screens from "./pages/Screens.tsx";
import Media from "./pages/Media.tsx";
import Schedules from "./pages/Schedules.tsx";
import Publishing from "./pages/Publishing.tsx";
import DeviceLogs from "./pages/DeviceLogs.tsx";
import ContentStudio from "./pages/ContentStudio.tsx";
import AppStore from "./pages/AppStore.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

// App root component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/screens" element={<ProtectedRoute><Screens /></ProtectedRoute>} />
                <Route path="/media" element={<ProtectedRoute><Media /></ProtectedRoute>} />
                <Route path="/schedules" element={<ProtectedRoute><Schedules /></ProtectedRoute>} />
                <Route path="/studio" element={<ProtectedRoute><ContentStudio /></ProtectedRoute>} />
                <Route path="/publishing" element={<ProtectedRoute><Publishing /></ProtectedRoute>} />
                <Route path="/device-logs" element={<ProtectedRoute><DeviceLogs /></ProtectedRoute>} />
                <Route path="/app-store" element={<ProtectedRoute><AppStore /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
