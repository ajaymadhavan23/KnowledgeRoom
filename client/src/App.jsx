import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import BlogFeedPage from "./pages/BlogFeedPage.jsx";
import BlogPostPage from "./pages/BlogPostPage.jsx";
import FolderPage from "./pages/FolderPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ItemEditorPage from "./pages/ItemEditorPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MyPostsPage from "./pages/MyPostsPage.jsx";
import MySpacePage from "./pages/MySpacePage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import SavedPage from "./pages/SavedPage.jsx";
import AppLayout from "./components/shared/AppLayout.jsx";
import LoadingState from "./components/shared/LoadingState.jsx";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, booting, isAdmin } = useAuth();
  if (booting) return <LoadingState label="Loading Knowledge Room..." fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/space" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, booting } = useAuth();
  if (booting) return <LoadingState label="Loading Knowledge Room..." fullScreen />;
  return user ? <Navigate to="/space" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/" element={<Navigate to="/space" replace />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="space" element={<MySpacePage />} />
            <Route path="space/folder/:folderId" element={<FolderPage />} />
            <Route path="space/saved" element={<SavedPage />} />
            <Route path="items/new" element={<ItemEditorPage />} />
            <Route path="items/:id" element={<ItemEditorPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="blog" element={<BlogFeedPage />} />
            <Route path="blog/:id" element={<BlogPostPage />} />
            <Route path="my-posts" element={<MyPostsPage />} />
            <Route path="profile/:id" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
