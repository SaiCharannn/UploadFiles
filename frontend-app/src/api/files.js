


import axios from 'axios'
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const getMyFiles     = ()       => axios.get(`${API}/files/`)
export const uploadFile     = (fd)     => axios.post(`${API}/files/`, fd)
export const deleteFile     = (id)     => axios.delete(`${API}/files/${id}/delete/`)

// Admin
export const getLabs        = ()       => axios.get(`${API}/admin/labs/`)
export const getCandidatesByLab = (lab) => axios.get(`${API}/admin/labs/`, { params: { lab } })
export const getCandidateFiles  = (uid) => axios.get(`${API}/admin/candidates/${uid}/files/`)
export const markPrinted    = (id)     => axios.post(`${API}/admin/files/${id}/print/`)
export const getDownloadUrl = (id)     => axios.get(`${API}/admin/files/${id}/download/`)
export const getAdminFiles  = (params) => axios.get(`${API}/files/`, { params })
