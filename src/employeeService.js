import axios from 'axios';

const BASE_URL = 'https://employee-management-backend-2l36.onrender.com/api/employees';
const AUTH_URL = 'https://employee-management-backend-2136.onrender.com/api/auth';

//Add token to every request automatically
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const loginAdmin = (credentials) => axios.post(`${AUTH_URL}/login`, credentials);
export const getAllEmployees = () => axios.get(BASE_URL);
export const getEmployeeById = (id) => axios.get(`${BASE_URL}/${id}`);
export const createEmployee = (employee) => axios.post(BASE_URL, employee);
export const updateEmployee = (id, employee) => axios.put(`${BASE_URL}/${id}`, employee);
export const deleteEmployee = (id) => axios.delete(`${BASE_URL}/${id}`);

export const downloadSalarySlip = async (id, name) => {
  const BASE = 'https://employee-management-backend-2l36.onrender.com';
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE}/api/salary-slip/${id}`, {
    headers: { Authorization: `Bearer ${token}`}
  });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `salary-slip-${name.replace(/ /g, '-')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const uploadEmployeePhoto = async (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const BASE = 'https://employee-management-backend-2l36.onrender.com';
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE}/api/employees/${id}/upload-photo`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`},
    body: formData,
  });
  return response.json();
};
