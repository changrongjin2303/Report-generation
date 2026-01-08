// API 配置
// 开发环境使用 localhost:8000，生产环境使用相对路径（由 Nginx 反向代理）
export const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:8000';

// 完整的 API 路径
export const API_ENDPOINTS = {
  fileCategories: `${API_BASE_URL}/api/file-categories`,
  projects: `${API_BASE_URL}/api/projects`,
  preview: `${API_BASE_URL}/api/preview`,
  generate: `${API_BASE_URL}/api/generate`,
};

// 辅助函数：生成项目相关的 API 路径
export const getProjectAPI = (id: number) => ({
  detail: `${API_BASE_URL}/api/projects/${id}`,
  save: `${API_BASE_URL}/api/projects/${id}/save`,
  upload: `${API_BASE_URL}/api/projects/${id}/upload`,
  delete: `${API_BASE_URL}/api/projects/${id}`,
});

// 辅助函数：生成文件相关的 API 路径
export const getFileAPI = (id: number) => ({
  delete: `${API_BASE_URL}/api/files/${id}`,
});
