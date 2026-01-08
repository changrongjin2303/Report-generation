import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Space, Typography, Badge } from 'antd';
import {
  HomeOutlined,
  FolderOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人设置',
      onClick: () => console.log('个人设置'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: () => {
        localStorage.removeItem('user');
        navigate('/login');
      },
    },
  ];

  // 侧边栏菜单
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '项目管理',
      onClick: () => navigate('/'),
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: '报告中心',
      onClick: () => console.log('报告中心'),
    },
    {
      key: '/templates',
      icon: <FolderOutlined />,
      label: '模板管理',
      onClick: () => console.log('模板管理'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => console.log('系统设置'),
    },
  ];

  const currentPath = location.pathname.startsWith('/project/') ? '/' : location.pathname;

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: '1px solid #f0f0f0',
        }}
      >
        {/* Logo 区域 */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
            padding: '0 16px',
          }}
        >
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <Text strong style={{ fontSize: 14 }}>
                咨询报告AI生成助手
              </Text>
            </div>
          ) : (
            <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          )}
        </div>

        {/* 菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[currentPath]}
          items={menuItems}
          style={{ borderRight: 0, marginTop: 16 }}
        />
      </Sider>

      {/* 右侧主体区域 */}
      <AntLayout style={{ marginLeft: collapsed ? 80 : 220, transition: 'all 0.2s' }}>
        {/* 顶部标题栏 */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 999,
          }}
        >
          {/* 左侧：折叠按钮 */}
          <div style={{ cursor: 'pointer' }} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <MenuUnfoldOutlined style={{ fontSize: 18 }} /> : <MenuFoldOutlined style={{ fontSize: 18 }} />}
          </div>

          {/* 右侧：通知 + 用户信息 */}
          <Space size="large">
            {/* 通知 */}
            <Badge count={5} offset={[-2, 2]}>
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>

            {/* 用户信息 */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                <Text>管理员</Text>
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content
          style={{
            margin: 0,
            minHeight: 'calc(100vh - 64px)',
            background: '#f0f2f5',
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default AppLayout;
