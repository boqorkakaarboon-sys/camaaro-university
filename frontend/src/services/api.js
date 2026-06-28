import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', withCredentials: true });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('camaaro_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('camaaro_token');
      localStorage.removeItem('camaaro_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login:           (d) => api.post('/auth/login', d),
  verify2FA:       (d) => api.post('/auth/verify-2fa', d),
  register:        (d) => api.post('/auth/register', d),
  getMe:           ()  => api.get('/auth/me'),
  updateProfile:   (d) => api.put('/auth/updateprofile', d),
  toggle2FA:       ()  => api.put('/auth/toggle-2fa'),
  forgotPassword:  (d) => api.post('/auth/forgot-password', d),
  resetPassword:   (token, d) => api.post(`/auth/reset-password/${token}`, d),
  getNotifications:()  => api.get('/auth/notifications'),
  readAllNotifs:   ()  => api.put('/auth/notifications/read-all'),
  verifyCert:      (code) => api.get(`/auth/verify-certificate/${code}`),
  getMyCertificates:() => api.get('/auth/my-certificates'),
};

export const usersAPI = {
  getAll:    (p) => api.get('/users', { params: p }),
  getOne:    (id) => api.get(`/users/${id}`),
  create:    (d)  => api.post('/users', d),
  update:    (id, d) => api.put(`/users/${id}`, d),
  remove:    (id) => api.delete(`/users/${id}`),
  getTeachers: () => api.get('/users/teachers'),
  getStudents: () => api.get('/users/students'),
};

export const coursesAPI = {
  getAll:    (p) => api.get('/courses', { params: p }),
  getAllAdmin: () => api.get('/courses/all'),
  getOne:    (id) => api.get(`/courses/${id}`),
  create:    (d)  => api.post('/courses', d),
  update:    (id, d) => api.put(`/courses/${id}`, d),
  remove:    (id) => api.delete(`/courses/${id}`),
  enrollStudent: (courseId, studentId) => api.put(`/courses/${courseId}/enroll`, { studentId }),
  assignTeacher: (courseId, teacherId) => api.put(`/courses/${courseId}/assign-teacher`, { teacherId }),
  getMaterials: (id) => api.get(`/courses/${id}/materials`),
  uploadMaterial: (id, d) => api.post(`/courses/${id}/materials`, d),
  deleteMaterial: (id, mId) => api.delete(`/courses/${id}/materials/${mId}`),
};

export const examsAPI = {
  getAll:    (p) => api.get('/exams', { params: p }),
  getAllAdmin: () => api.get('/exams/all'),
  getOne:    (id) => api.get(`/exams/${id}`),
  create:    (d)  => api.post('/exams', d),
  update:    (id, d) => api.put(`/exams/${id}`, d),
  remove:    (id) => api.delete(`/exams/${id}`),
  publish:   (id) => api.put(`/exams/${id}/publish`),
  startExam: (id) => api.post(`/exams/${id}/start`),
  autosave:  (id, d) => api.patch(`/exams/${id}/autosave`, d),
  submitExam:(id, d) => api.post(`/exams/${id}/submit`, d),
  getResults:(id) => api.get(`/exams/${id}/results`),
  getMyResult:(id) => api.get(`/exams/${id}/myresult`),
  getMyResults: () => api.get('/results/mine'),
  manualGrade:(resultId, d) => api.patch(`/exams/results/${resultId}/grade`, d),
  addResult: (examId, d) => api.post(`/exams/${examId}/results`, d),
};

export const resultsAPI = {
  getAll:    (p) => api.get('/results', { params: p }),
  getMyResults: () => api.get('/results/mine'),
  getTranscript:() => api.get('/results/transcript'),
  getByExam: (examId) => api.get(`/results/exam/${examId}`),
  getMine:   (examId) => api.get(`/results/${examId}/mine`),
};

export const libraryAPI = {
  getAll:    (p) => api.get('/library', { params: p }),
  getOne:    (id) => api.get(`/library/${id}`),
  create:    (d)  => api.post('/library', d),
  update:    (id, d) => api.put(`/library/${id}`, d),
  remove:    (id) => api.delete(`/library/${id}`),
  borrow:    (id) => api.post(`/library/${id}/borrow`),
  returnBook:(id) => api.post(`/library/${id}/return`),
  updateProgress:(id,d) => api.put(`/library/${id}/progress`, d),
  addBookmark:(id,d) => api.post(`/library/${id}/bookmark`, d),
  getCategories:() => api.get('/library/meta/categories'),
  getMyBorrowed:() => api.get('/library/my/borrowed'),
};

export const attendanceAPI = {
  getByCourse: (courseId, date) => api.get(`/attendance/${courseId}`, { params: { date } }),
  mark:        (d) => api.post('/attendance', d),
  getMine:     ()  => api.get('/attendance/student/mine'),
};

export const assignmentsAPI = {
  getAll:      (p) => api.get('/assignments', { params: p }),
  create:      (d) => api.post('/assignments', d),
  submit:      (id, d) => api.post(`/assignments/${id}/submit`, d),
  grade:       (id, studentId, d) => api.put(`/assignments/${id}/grade/${studentId}`, d),
  getSubmissions:(id) => api.get(`/assignments/${id}/submissions`),
};

export const discussionsAPI = {
  getThreads:  (courseId) => api.get(`/discussions/${courseId}`),
  createThread:(courseId, d) => api.post(`/discussions/${courseId}`, d),
  reply:       (courseId, threadId, d) => api.post(`/discussions/${courseId}/${threadId}/reply`, d),
  deleteThread:(courseId, threadId) => api.delete(`/discussions/${courseId}/${threadId}`),
  pin:         (courseId, threadId) => api.put(`/discussions/${courseId}/${threadId}/pin`),
};

export const qbAPI = {
  getAll:  (p) => api.get('/questionbank', { params: p }),
  create:  (d) => api.post('/questionbank', d),
  bulk:    (d) => api.post('/questionbank/bulk', d),
  remove:  (id) => api.delete(`/questionbank/${id}`),
};

export const analyticsAPI = {
  overview:    () => api.get('/analytics/overview'),
  byCourse:    (id) => api.get(`/analytics/course/${id}`),
  auditLog:    () => api.get('/analytics/auditlog'),
  leaderboard: (courseId) => api.get('/analytics/leaderboard', { params: { courseId } }),
  myProgress:  () => api.get('/analytics/my-progress'),
  studentDetail: (studentId) => api.get(`/analytics/student/${studentId}`),
  examStats:   (examId) => api.get(`/analytics/exam-stats/${examId}`),
};

export const departmentsAPI = {
  getAll:  () => api.get('/departments'),
  create:  (d) => api.post('/departments', d),
  update:  (id, d) => api.put(`/departments/${id}`, d),
  remove:  (id) => api.delete(`/departments/${id}`),
};

export const settingsAPI = {
  get:     () => api.get('/settings'),
  update:  (d) => api.put('/settings', d),
};

export const certificatesAPI = {
  getMine: () => api.get('/auth/my-certificates'),
};

export const bulkImportAPI = {
  importUsers: (users) => api.post('/users/bulk-import', { users }),
};

export const aiAPI = {
  generateExam:(d) => api.post('/ai/generate-exam', d),
  gradeEssay:  (d) => api.post('/ai/grade-essay', d),
  chat:        (d) => api.post('/ai/chat', d),
};

export default api;
