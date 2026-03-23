import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from './ProtectedRoute'
import { ErrorPage } from '@/components/ErrorPage'

import { AuthPage } from '@/features/auth/AuthPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { CollectionsPage } from '@/features/collections/CollectionsPage'
import { PublicLibraryPage } from '@/features/collections/PublicLibraryPage'
import { CollectionDetailPage } from '@/features/collections/CollectionDetailPage'
import { CollectionEditPage } from '@/features/collections/CollectionEditPage'
import { CollectionCreatePage } from '@/features/collections/CollectionCreatePage'
import { PlaylistsPage } from '@/features/playlists/PlaylistsPage'
import { PlaylistDetailPage } from '@/features/playlists/PlaylistDetailPage'
import { GamePage } from '@/features/games/GamePage'
import { GameHubPage } from '@/features/games/GameHubPage'
import { AboutPage } from '@/features/about/AboutPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { AdminPage } from '@/features/admin/AdminPage'
import { CategoriesPage } from '@/features/categories/CategoriesPage'
import { CategoryCollectionsPage } from '@/features/categories/CategoryCollectionsPage'
import { PublicCollectionPage } from '@/features/collections/PublicCollectionPage'
import { CollectionTagsPage } from '@/features/tags/CollectionTagsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <ErrorPage />,
    children: [
      { path: 'login', element: <AuthPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'reset/:token', element: <ResetPasswordPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <Layout />,
            children: [
              { index: true, element: <Navigate to="/library" replace /> },
              { path: 'library', element: <CollectionsPage /> },
              { path: 'library/public', element: <PublicLibraryPage /> },
              { path: 'library/public/:id', element: <PublicCollectionPage /> },
              { path: 'collections/:id', element: <CollectionDetailPage /> },
              { path: 'collections/:id/edit', element: <CollectionEditPage /> },
              { path: 'collections/new', element: <CollectionCreatePage /> },
              { path: 'playlists', element: <PlaylistsPage /> },
              { path: 'playlists/:id', element: <PlaylistDetailPage /> },
              { path: 'play/:id', element: <GameHubPage /> },
              { path: 'play/:type/:id', element: <GamePage /> },
              { path: 'profile', element: <ProfilePage /> },
              { path: 'categories', element: <CategoriesPage /> },
              { path: 'categories/:id', element: <CategoryCollectionsPage /> },
              { path: 'tags', element: <CollectionTagsPage /> },
              { path: '*', element: <Navigate to="/library" replace /> },
            ],
          },
          {
            element: <ProtectedRoute requiredRole="admin" />,
            children: [
              {
                element: <Layout />,
                children: [{ path: 'admin', element: <AdminPage /> }],
              },
            ],
          },
        ],
      },
    ],
  },
])
