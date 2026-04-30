import api from './auth';
export const getCandidateFolders = (lab='') => api.get(`/api/admin/candidates/${lab?`?lab=${lab}`:''}`).then(r=>r.data);
export const getCandidateFiles   = (uid)    => api.get(`/api/admin/candidates/${uid}/files/`).then(r=>r.data);
export const markAsPrinted       = (id)     => api.post(`/api/admin/files/${id}/print/`).then(r=>r.data);
export const getFileUrl          = (path)   => `${import.meta.env.VITE_API_BASE_URL}/media/${path}`;