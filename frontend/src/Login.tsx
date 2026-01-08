import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Checkbox, message, Space } from 'antd';
import { UserOutlined, LockOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleLogin = async (values: any) => {
    setLoading(true);

    // 模拟登录请求
    setTimeout(() => {
      // 简单验证：用户名 admin，密码 123456
      if (values.username === 'admin' && values.password === '123456') {
        localStorage.setItem('user', JSON.stringify({
          username: values.username,
          name: '管理员',
          token: 'mock-token-' + Date.now(),
        }));
        message.success('登录成功！');
        navigate('/');
      } else {
        message.error('用户名或密码错误（提示：admin / 123456）');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 450,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          borderRadius: 12,
        }}
        bodyStyle={{ padding: '48px 40px' }}
      >
        {/* Logo 和标题 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              marginBottom: 16,
            }}
          >
            <FileTextOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <Title level={2} style={{ margin: '8px 0' }}>
            咨询报告AI生成助手
          </Title>
          <Text type="secondary">欢迎回来，请登录您的账户</Text>
        </div>

        {/* 登录表单 */}
        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#999' }} />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住我</Checkbox>
              </Form.Item>
              <a href="#" style={{ color: '#1890ff' }}>
                忘记密码？
              </a>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 48 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        {/* 提示信息 */}
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: '#f5f5f5',
            borderRadius: 8,
            textAlign: 'center',
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            测试账号：admin / 123456
          </Text>
        </div>

        {/* 底部链接 */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Text type="secondary">
            还没有账户？ <a href="#" style={{ color: '#1890ff' }}>立即注册</a>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
