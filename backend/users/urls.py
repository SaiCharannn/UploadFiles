from django.urls import path
from .views import (
    SuperAdminCheckView, SuperAdminCreateView,
    LoginView, LogoutView, MeView,
    UserListView, BulkUserCreateView, UnlockUserView, ResetPasswordView,
    FileUploadView, FileDeleteView,
    AdminCandidateFoldersView, AdminCandidateFilesView,
    AdminFilePrintView, FileDownloadPathView,
    BulkUploadLogListView,
)

urlpatterns = [
    # Super Admin setup (one-time, no auth)
    path('superadmin/check/',   SuperAdminCheckView.as_view()),
    path('superadmin/create/',  SuperAdminCreateView.as_view()),

    # Auth
    path('auth/login/',   LoginView.as_view()),
    path('auth/logout/',  LogoutView.as_view()),
    path('auth/me/',      MeView.as_view()),

    # User management
    path('users/',                              UserListView.as_view()),
    path('users/bulk/',                         BulkUserCreateView.as_view()),
    path('users/bulk/history/',                  BulkUploadLogListView.as_view()),
    path('users/<str:user_id>/unlock/',         UnlockUserView.as_view()),
    path('users/<str:user_id>/reset-password/', ResetPasswordView.as_view()),

    # Candidate file upload
    path('files/',                 FileUploadView.as_view()),
    path('files/<int:pk>/delete/', FileDeleteView.as_view()),

    # Admin print workflow
    path('admin/labs/',                               AdminCandidateFoldersView.as_view()),
    path('admin/candidates/<str:user_id>/files/',     AdminCandidateFilesView.as_view()),
    path('admin/files/<int:pk>/print/',               AdminFilePrintView.as_view()),
    path('admin/files/<int:pk>/download/',            FileDownloadPathView.as_view()),
]
