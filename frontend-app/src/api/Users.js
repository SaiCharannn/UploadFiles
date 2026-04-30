import axios from 'axios'
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const getUsers        = (params)           => axios.get(`${API}/users/`, { params })
export const bulkUpload      = (formData)          => axios.post(`${API}/users/bulk/`, formData)
export const getBulkHistory  = ()                  => axios.get(`${API}/users/bulk/history/`)
export const unlockUser      = (uid)               => axios.post(`${API}/users/${uid}/unlock/`)
export const resetPwd        = (uid, password)     => axios.post(`${API}/users/${uid}/reset-password/`, { password })
