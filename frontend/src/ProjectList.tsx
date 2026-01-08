import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Modal, Form, Input, message, Typography, Space, Popconfirm } from 'antd';
import { PlusOutlined, FolderOpenOutlined, DeleteOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Project {
  id: number;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/projects');
      setProjects(res.data);
    } catch (error) {
      message.error('加载项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await axios.post('http://localhost:8000/api/projects', values);
      message.success('项目创建成功');
      setIsModalVisible(false);
      form.resetFields();
      fetchProjects();
    } catch (error: any) {
      console.error(error);
      // 显示具体错误信息，方便排查
      const errorMsg = error.response?.data?.detail || '创建失败: 请检查后端服务是否重启';
      message.error(errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/projects/${id}`);
      message.success('删除成功');
      fetchProjects();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <a onClick={() => navigate(`/project/${record.id}`)} style={{ fontWeight: 500, fontSize: 16 }}>
          <FolderOpenOutlined style={{ marginRight: 8 }} />
          {text}
        </a>
      ),
    },
    {
      title: '项目编号',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Project) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/project/${record.id}`)}>
            进入项目 <RightOutlined />
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>项目管理</Title>
          <Text type="secondary">管理您的工程造价咨询项目</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          新建项目
        </Button>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <Table 
          columns={columns} 
          dataSource={projects} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }} 
        />
      </Card>

      <Modal
        title="新建项目"
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="例如：江南大道景观提升工程" />
          </Form.Item>
          <Form.Item name="code" label="项目编号">
            <Input placeholder="例如：2026-HZ-001" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectList;
