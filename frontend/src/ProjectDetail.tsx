import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, DatePicker, Button, Card, Typography, Space, Divider, message, Row, Col, Alert, Steps, Segmented, Spin, List, Upload, Empty, Collapse, Select, Badge, Modal } from 'antd';
import { MinusCircleOutlined, PlusOutlined, DownloadOutlined, FileTextOutlined, CloudUploadOutlined, CheckCircleOutlined, EyeOutlined, InfoCircleOutlined, ReloadOutlined, SaveOutlined, ArrowLeftOutlined, InboxOutlined, FilePdfOutlined, DeleteOutlined, FolderOutlined, FolderOpenOutlined, ThunderboltOutlined, SyncOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import PreviewReport from './PreviewReport';
import { API_ENDPOINTS, getProjectAPI, getFileAPI } from './config';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // 页面加载
  const [generating, setGenerating] = useState(false); // 生成报告中
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [projectData, setProjectData] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('其他');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [folderStatus, setFolderStatus] = useState<Record<string, { status: 'idle' | 'scanning' | 'completed', progress: number }>>({});
  const [isExtracting, setIsExtracting] = useState(false);
  const [scanningCount, setScanningCount] = useState(0);

  const [rightPanelMode, setRightPanelMode] = useState<'preview' | 'status'>('preview');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [form] = Form.useForm();
  
  // 实时监听表单数据，用于预览
  const watchedValues = Form.useWatch([], form);

  // 获取文件夹分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.fileCategories);
        const cats = res.data.categories;
        setCategories(cats);
        // 默认展开所有文件夹
        setExpandedFolders(cats);
      } catch (error) {
        console.error('获取分类失败', error);
      }
    };
    fetchCategories();
  }, []);

  // 初始化加载项目数据
  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        const res = await axios.get(getProjectAPI(Number(id)).detail);
        setProjectData(res.data);
        setFiles(res.data.files);
        
        // 填充表单
        const formData = { ...res.data.data };
        // 处理日期格式
        ['report_date', 'start_date', 'end_date', 'audit_period_start', 'audit_period_end'].forEach(key => {
          if (formData[key]) formData[key] = dayjs(formData[key], 'YYYY年MM月DD日');
        });
        
        form.setFieldsValue(formData);
        
        // 初次加载完尝试预览一次
        setTimeout(() => fetchPreview(), 1000); 
      } catch (error) {
        message.error('加载项目详情失败');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProject();
  }, [id]);

  // 格式化数据 helper
  const formatData = (values: any) => ({
    ...values,
    report_date: values.report_date ? values.report_date.format('YYYY年MM月DD日') : '',
    start_date: values.start_date ? values.start_date.format('YYYY年MM月DD日') : '',
    end_date: values.end_date ? values.end_date.format('YYYY年MM月DD日') : '',
    audit_period_start: values.audit_period_start ? values.audit_period_start.format('YYYY年MM月DD日') : '',
    audit_period_end: values.audit_period_end ? values.audit_period_end.format('YYYY年MM月DD日') : '',
    contract_amount: parseFloat(values.contract_amount || 0),
    submit_amount_wan: parseFloat(values.submit_amount_wan || 0),
    audit_amount: parseFloat(values.audit_amount || 0),
    final_approved_amount: parseFloat(values.final_approved_amount || 0),
    reduction_amount: parseFloat(values.reduction_amount || 0),
    bidding_price_control: parseFloat(values.bidding_price_control || 0),
    bidding_price_winning: parseFloat(values.bidding_price_winning || 0),
    audit_fee_deduction: parseFloat(values.audit_fee_deduction || 0),
  });

  // 保存数据
  const handleSave = async () => {
    setSaving(true);
    try {
      // 保存草稿不验证必填项，直接获取表单值
      const values = form.getFieldsValue();
      const formattedData = formatData(values);
      await axios.put(getProjectAPI(Number(id)).save, { data: formattedData });
      message.success('草稿保存成功');
    } catch (error: any) {
      console.error('保存失败:', error);
      const errorMsg = error.response?.data?.detail || '保存失败，请重试';
      message.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // 生成 PDF 预览
  const fetchPreview = async () => {
    setPreviewLoading(true);
    try {
      // 获取当前表单值（不校验必填，允许预览半成品）
      const values = form.getFieldsValue(); 
      const formattedData = formatData(values);
      
      const response = await axios.post(API_ENDPOINTS.preview, { data: formattedData }, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPdfUrl(url);
    } catch (error) {
      console.error('预览失败', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  // 生成并下载 Word
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const values = await form.validateFields();
      const formattedData = formatData(values);

      // 先自动保存一次
      await axios.put(getProjectAPI(Number(id)).save, { data: formattedData });

      const response = await axios.post(API_ENDPOINTS.generate, { data: formattedData }, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${values.project_name || 'report'}_审核报告.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('报告生成并下载成功！');
    } catch (error) {
      message.error('生成失败，请检查填写内容');
    } finally {
      setGenerating(false);
    }
  };

  // 自定义文件上传
  const handleFileUpload = async (file: any) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', selectedCategory);

    try {
      const res = await axios.post(
        getProjectAPI(Number(id)).upload,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      message.success(`${file.name} 上传到 [${selectedCategory}] 成功`);
      setFiles(prev => [...prev, res.data]);
      return res.data;
    } catch (error) {
      message.error(`${file.name} 上传失败`);
      throw error;
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    customRequest: async ({ file, onSuccess, onError }: any) => {
      try {
        const result = await handleFileUpload(file);
        onSuccess(result);
      } catch (error) {
        onError(error);
      }
    },
    showUploadList: false,
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      await axios.delete(getFileAPI(fileId).delete);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      message.success('文件已删除');
    } catch (e) {
      message.error('删除失败');
    }
  };

  // 展开/折叠所有文件夹
  const handleToggleAllFolders = () => {
    if (expandedFolders.length === categories.length) {
      // 全部折叠
      setExpandedFolders([]);
    } else {
      // 全部展开
      setExpandedFolders(categories);
    }
  };

  // AI 智能提取模拟 - 并发池调度版本
  const handleAIExtract = async () => {
    if (isExtracting) {
      message.warning('正在提取中，请稍候...');
      return;
    }

    setIsExtracting(true);
    setScanningCount(0);

    // 获取当前表单中已保存的草稿数据
    const currentFormData = form.getFieldsValue();

    // 开始前清空表单
    form.resetFields();
    message.info('开始AI智能提取，请稍候...');

    // 初始化所有文件夹状态
    const initialStatus: Record<string, { status: 'idle' | 'scanning' | 'completed', progress: number }> = {};
    categories.forEach(cat => {
      initialStatus[cat] = { status: 'idle', progress: 0 };
    });
    setFolderStatus(initialStatus);

    // 模拟数据（使用真实项目数据）
    const defaultMockData: Record<string, any> = {
      project_name: '江南大道及两侧楼宇景观亮化提升工程(EPC)工程总承包',
      report_code: 'Q/SC-2025-B223-173',
      report_date: dayjs('2025-08-08', 'YYYY-MM-DD'),
      client_name: '杭州滨江城建发展有限公司',
      project_description: '江南大道及两侧楼宇景观亮化提升，主要包括灯杆、控制系统、管线电缆、配电箱及变压器材等，涉及50处建筑节点、约117幢建筑',
      builder_name: '杭州益创城市建设发展有限公司',
      designer_name: '中国美术学院风景建筑设计研究总院有限公司',
      contractor_name: '神州交建工程集团有限公司',
      supervisor_name: '浙江明通工程咨询有限公司',
      agent_name: '杭州滨江城建有限公司',
      duration_days: 75,
      start_date: dayjs('2022-05-16', 'YYYY-MM-DD'),
      end_date: dayjs('2022-12-02', 'YYYY-MM-DD'),
      contract_amount: 6513.03,
      submit_amount_wan: 6541.90,
      audit_amount: 6496.05,
      final_approved_amount: 6496.05,
      reduction_amount: 45.85,
      bidding_method: '公开招标',
      bidding_price_control: 814.13,
      bidding_price_winning: 6513.03,
      quality_status: '（1）经审核，本工程质量合格，符合设计要求；\n（2）施工过程中无重大质量问题；\n（3）已通过竣工验收。',
      audit_fee_deduction: 0,
      audit_period_start: dayjs('2022-05-16', 'YYYY-MM-DD'),
      audit_period_end: dayjs('2022-12-02', 'YYYY-MM-DD'),
      adjustments_description: '（1）渡口大厦工程量及单价调整，核减造价约10.42万元；\n（2）海康威视工程量清单及单价调整，核减造价约13.5万元；\n（3）华洲中心工程量清单及单价调整，核减造价约11.4万元；\n（4）恒鑫大厦工程量清单及单价调整，核减造价约16.5万元；',
      other_notes: '（1）本工程不存在甩项；\n（2）本工程不存在未完工程内容。',
    };

    // 合并草稿数据和默认数据（优先使用草稿数据）
    const mockData: Record<string, any> = {};
    Object.keys(defaultMockData).forEach(key => {
      // 如果草稿中有数据且不为空，使用草稿数据；否则使用默认数据
      const draftValue = currentFormData[key];
      if (draftValue !== undefined && draftValue !== null && draftValue !== '') {
        mockData[key] = draftValue;
      } else {
        mockData[key] = defaultMockData[key];
      }
    });

    // 随机打乱字段顺序（Fisher-Yates shuffle）
    const allFields = Object.keys(mockData);
    const shuffledFields = [...allFields];
    for (let i = shuffledFields.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledFields[i], shuffledFields[j]] = [shuffledFields[j], shuffledFields[i]];
    }

    // 为每个文件夹分配随机字段（每个文件夹1-2个字段）
    const fieldsPerFolder: Record<string, string[]> = {};
    let fieldIndex = 0;
    categories.forEach(cat => {
      const numFields = Math.floor(Math.random() * 2) + 1; // 1-2个字段
      fieldsPerFolder[cat] = shuffledFields.slice(fieldIndex, fieldIndex + numFields);
      fieldIndex += numFields;
    });

    const maxConcurrent = 3; // 最大并发数
    let currentIndex = 0;
    let completedCount = 0;
    const totalCount = categories.length;

    // 扫描单个文件夹
    const scanFolder = async (category: string, index: number) => {
      // 随机扫描时长（1-3秒）
      const duration = Math.random() * 2000 + 1000;
      const startTime = Date.now();

      // 更新为扫描中状态
      setFolderStatus(prev => ({
        ...prev,
        [category]: { status: 'scanning', progress: 0 }
      }));

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);

        setFolderStatus(prev => ({
          ...prev,
          [category]: { status: 'scanning', progress }
        }));
      }, 50);

      // 等待扫描完成
      await new Promise(resolve => setTimeout(resolve, duration));

      // 清除进度更新
      clearInterval(progressInterval);

      // 标记为完成
      setFolderStatus(prev => ({
        ...prev,
        [category]: { status: 'completed', progress: 100 }
      }));

      completedCount++;
      setScanningCount(completedCount);

      // 随机分散填充该文件夹对应的字段
      const fieldsToFill = fieldsPerFolder[category] || [];
      fieldsToFill.forEach((field, idx) => {
        const randomDelay = Math.random() * 500 + 100; // 100-600ms 随机延迟
        setTimeout(() => {
          if (mockData[field] !== undefined) {
            form.setFieldValue(field, mockData[field]);
          }
        }, randomDelay);
      });
    };

    // 并发池调度
    const runningTasks: Promise<void>[] = [];

    while (currentIndex < totalCount || runningTasks.length > 0) {
      // 启动新任务直到达到并发上限
      while (currentIndex < totalCount && runningTasks.length < maxConcurrent) {
        const category = categories[currentIndex];
        const index = currentIndex;
        currentIndex++;

        const task = scanFolder(category, index);
        runningTasks.push(task);

        // 任务完成后从数组中移除
        task.then(() => {
          const taskIndex = runningTasks.indexOf(task);
          if (taskIndex > -1) {
            runningTasks.splice(taskIndex, 1);
          }
        });
      }

      // 等待至少一个任务完成
      if (runningTasks.length > 0) {
        await Promise.race(runningTasks);
      }
    }

    // 全部扫描完成
    setIsExtracting(false);

    // 显示成功消息
    message.success({
      content: (
        <div>
          <div>AI 智能提取完成！</div>
          <div style={{ marginTop: 8, fontSize: 12 }}>
            <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>⚠️ 以下字段需人工校核：</span>
            <div style={{ marginTop: 4 }}>
              监理单位、工程质量情况
            </div>
          </div>
        </div>
      ),
      duration: 5,
    });

    // 为失败字段添加橙色样式
    setTimeout(() => {
      const failedFields = ['supervisor_name', 'quality_status'];
      failedFields.forEach(field => {
        const input = document.querySelector(`[id="${field}"]`) as HTMLInputElement;
        if (input && input.value === '提取失败需人工校核') {
          input.style.color = '#fa8c16';
          input.style.fontWeight = 'bold';
        }
      });
    }, 500);
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: '16px' }}>
      {/* 顶部导航 */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>返回列表</Button>
          <Title level={4} style={{ margin: 0 }}>{projectData?.name}</Title>
        </Space>
        <Space>
          <Button icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存草稿</Button>
          <Button type="primary" icon={<DownloadOutlined />} loading={generating} onClick={handleGenerate}>生成报告</Button>
        </Space>
      </div>

      <Row gutter={24} style={{ width: '100%', margin: 0 }}>
        
        {/* 左侧：资料库 (20%) */}
        <Col xs={24} xl={5} xxl={4}>
           <Card
             title="项目资料库"
             bordered={false}
             style={{ height: 'calc(100vh - 80px)', overflowY: 'auto' }}
             extra={
               <Button
                 type="primary"
                 size="small"
                 icon={<PlusOutlined />}
                 onClick={() => setUploadModalVisible(true)}
               >
                 上传
               </Button>
             }
           >
             {/* 操作按钮区域 */}
             <div style={{ marginBottom: 16 }}>
               <Space direction="vertical" style={{ width: '100%' }} size="small">
                 {/* AI 自动提取按钮 */}
                 <Button
                   block
                   type="primary"
                   icon={<ThunderboltOutlined />}
                   onClick={handleAIExtract}
                   loading={isExtracting}
                   disabled={isExtracting}
                   style={{
                     background: isExtracting ? '#999' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                     border: 'none',
                     boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                   }}
                 >
                   {isExtracting ? '提取中...' : 'AI 智能提取'}
                 </Button>

                 {/* 扫描进度显示 */}
                 {isExtracting && (
                   <div style={{ textAlign: 'center', padding: '8px 0', background: '#f0f5ff', borderRadius: '4px' }}>
                     <Text style={{ fontSize: 12, color: '#1890ff' }}>
                       正在扫描 {scanningCount} / {categories.length}
                     </Text>
                   </div>
                 )}

                 {/* 全部展开/折叠图标按钮 */}
                 <div style={{ textAlign: 'center' }}>
                   <Button
                     type="text"
                     size="small"
                     icon={expandedFolders.length === categories.length ? <FolderOpenOutlined /> : <FolderOutlined />}
                     onClick={handleToggleAllFolders}
                     style={{ fontSize: 12, color: '#999' }}
                   >
                     {expandedFolders.length === categories.length ? '全部折叠' : '全部展开'}
                   </Button>
                 </div>
               </Space>
             </div>

             {/* 按文件夹分组展示 */}
             <Collapse
               ghost
               activeKey={expandedFolders}
               onChange={(keys) => setExpandedFolders(keys as string[])}
               items={categories.map(cat => {
                 const categoryFiles = files.filter(f => f.category === cat);
                 return {
                   key: cat,
                   label: (
                     <div style={{ position: 'relative', width: '100%' }}>
                       {/* 背景进度条 */}
                       {folderStatus[cat]?.status === 'scanning' && (
                         <div
                           style={{
                             position: 'absolute',
                             left: 0,
                             top: 0,
                             bottom: 0,
                             width: `${folderStatus[cat]?.progress || 0}%`,
                             background: 'linear-gradient(90deg, rgba(24, 144, 255, 0.1) 0%, rgba(24, 144, 255, 0.2) 100%)',
                             transition: 'width 0.1s linear',
                             borderRadius: '4px',
                             zIndex: 0,
                           }}
                         />
                       )}

                       {/* 文件夹内容 */}
                       <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                         {/* 图标 */}
                         {folderStatus[cat]?.status === 'completed' ? (
                           <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
                         ) : folderStatus[cat]?.status === 'scanning' ? (
                           <SyncOutlined spin style={{ color: '#1890ff', fontSize: 16 }} />
                         ) : (
                           <FolderOutlined style={{ color: '#faad14', fontSize: 16 }} />
                         )}

                         {/* 文件夹名称 */}
                         <span style={{
                           color: folderStatus[cat]?.status === 'scanning' ? '#1890ff' :
                                  folderStatus[cat]?.status === 'completed' ? '#52c41a' : 'inherit',
                           fontWeight: folderStatus[cat]?.status === 'scanning' ? 'bold' : 'normal'
                         }}>
                           {cat}
                         </span>

                         {/* 进度百分比 */}
                         {folderStatus[cat]?.status === 'scanning' && (
                           <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>
                             {Math.round(folderStatus[cat]?.progress || 0)}%
                           </Text>
                         )}

                         {/* 完成标记 */}
                         {folderStatus[cat]?.status === 'completed' && (
                           <Text style={{ fontSize: 12, color: '#52c41a', marginLeft: 'auto' }}>
                             已完成
                           </Text>
                         )}
                       </div>
                     </div>
                   ),
                   children: categoryFiles.length === 0 ? (
                     <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无文件" />
                   ) : (
                     <List
                       size="small"
                       dataSource={categoryFiles}
                       renderItem={(item: any) => (
                         <List.Item
                           style={{ padding: '8px 0' }}
                           actions={[
                             <DeleteOutlined
                               style={{ color: 'red', fontSize: 12 }}
                               onClick={() => handleDeleteFile(item.id)}
                             />
                           ]}
                         >
                           <List.Item.Meta
                             avatar={<FilePdfOutlined style={{ fontSize: 14 }} />}
                             title={<Text ellipsis={{ tooltip: item.filename }} style={{ fontSize: 12 }}>{item.filename}</Text>}
                             description={<Text type="secondary" style={{ fontSize: 11 }}>{dayjs(item.uploaded_at).format('MM-DD HH:mm')}</Text>}
                           />
                         </List.Item>
                       )}
                     />
                   )
                 };
               })}
             />
           </Card>
        </Col>

        {/* 中间：表单 (40%) */}
        <Col xs={24} xl={10} xxl={10}>
          <Card
            title={<Space><FileTextOutlined /><span>信息录入</span></Space>}
            bordered={false}
            style={{ height: 'calc(100vh - 80px)', overflowY: 'auto' }}
            extra={
              <Button
                size="small"
                danger
                onClick={() => {
                  form.resetFields();
                  message.success('已清空所有内容');
                }}
              >
                清空
              </Button>
            }
          >
            <Form form={form} layout="vertical">
              {/* 1. 基础信息 */}
              <Divider orientation="left" plain>项目基础信息</Divider>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="项目名称" name="project_name" rules={[{ required: true }]}>
                    <Input placeholder="请输入项目全称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="报告编号" name="report_code" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                   <Form.Item label="报告日期" name="report_date" rules={[{ required: true }]}>
                    <DatePicker locale={locale} style={{ width: '100%' }} format="YYYY年MM月DD日" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                   <Form.Item label="咨询作业开始" name="audit_period_start">
                    <DatePicker locale={locale} style={{ width: '100%' }} format="YYYY年MM月DD日" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                   <Form.Item label="咨询作业结束" name="audit_period_end">
                    <DatePicker locale={locale} style={{ width: '100%' }} format="YYYY年MM月DD日" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="委托方(主送单位)" name="client_name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="工程概况描述" name="project_description">
                    <TextArea rows={4} showCount maxLength={500} />
                  </Form.Item>
                </Col>
              </Row>

              {/* 2. 参建单位 */}
              <Divider orientation="left" plain>五方主体单位</Divider>
              <Row gutter={16}>
                <Col span={12}><Form.Item label="建设单位" name="builder_name"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="设计单位" name="designer_name"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="施工单位" name="contractor_name"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="监理单位" name="supervisor_name"><Input /></Form.Item></Col>
                <Col span={24}><Form.Item label="代建单位" name="agent_name"><Input /></Form.Item></Col>
              </Row>

              {/* 3. 招投标信息 */}
              <Divider orientation="left" plain>招投标信息</Divider>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="招标方式" name="bidding_method">
                    <Input placeholder="如：公开招标" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="招标控制价(万元)" name="bidding_price_control">
                    <InputNumber prefix="¥" style={{ width: '100%' }} precision={2} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="中标价(万元)" name="bidding_price_winning">
                    <InputNumber prefix="¥" style={{ width: '100%' }} precision={2} />
                  </Form.Item>
                </Col>
              </Row>

              {/* 4. 工期与金额 */}
              <Divider orientation="left" plain>合同与金额数据</Divider>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="合同工期(天)" name="duration_days">
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="开工日期" name="start_date">
                    <DatePicker locale={locale} style={{ width: '100%' }} format="YYYY年MM月DD日" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="竣工日期" name="end_date">
                    <DatePicker locale={locale} style={{ width: '100%' }} format="YYYY年MM月DD日" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16} style={{ background: '#fafafa', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                 <Col span={12}>
                  <Form.Item label="合同金额(万元)" name="contract_amount">
                    <InputNumber prefix="¥" style={{ width: '100%' }} precision={2} />
                  </Form.Item>
                </Col>
                 <Col span={12}>
                  <Form.Item label="送审金额(万元)" name="submit_amount_wan">
                    <InputNumber prefix="¥" style={{ width: '100%' }} precision={2} />
                  </Form.Item>
                </Col>
                 <Col span={12}>
                  <Form.Item label="核准金额(万元)" name="audit_amount" rules={[{ required: true }]}>
                    <InputNumber prefix="¥" style={{ width: '100%' }} precision={2} />
                  </Form.Item>
                </Col>
                 <Col span={12}>
                  <Form.Item label="最终审定(万元)" name="final_approved_amount" rules={[{ required: true }]}>
                    <InputNumber prefix="¥" style={{ width: '100%' }} precision={2} />
                  </Form.Item>
                </Col>
                 <Col span={12}>
                  <Form.Item label="核减金额(万元)" name="reduction_amount" rules={[{ required: true }]}>
                    <InputNumber prefix="¥" style={{ width: '100%', color: '#cf1322', fontWeight: 'bold' }} precision={2} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="追加审计费扣除(万元)" name="audit_fee_deduction">
                    <InputNumber prefix="¥" style={{ width: '100%' }} precision={2} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="工程质量情况" name="quality_status">
                    <Input.TextArea
                      rows={3}
                      placeholder="请填写工程质量情况，例如：&#10;（1）经审核，本工程质量合格，符合设计要求；&#10;（2）施工过程中无重大质量问题。"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* 5. 调整原因说明 */}
              <Divider orientation="left" plain>核增核减原因说明</Divider>
              <Form.Item
                label="1. 调整原因描述"
                name="adjustments_description"
                tooltip="请按照格式填写，例如：（1）垃圾清运3调整为垃圾清运2，核减造价2644元；"
              >
                <Input.TextArea
                  rows={4}
                  placeholder="请填写调整原因，例如：&#10;（1）垃圾清运3调整为垃圾清运2，核减造价2644元；&#10;（2）扣除定额人工费用，核减造价992元。"
                />
              </Form.Item>
              <Form.Item
                label="2. 其他说明"
                name="other_notes"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="请填写其他说明，例如：&#10;（1）本工程不存在甩项；&#10;（2）本工程不存在未完工程内容。"
                />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 右侧：预览 (40%) */}
        <Col xs={24} xl={9} xxl={10}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', height: 'calc(100vh - 80px)' }}>
            
            <Card bordered={false} bodyStyle={{ padding: '12px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Segmented
                  options={[
                    { label: 'Word 预览', value: 'preview', icon: <EyeOutlined /> },
                    { label: '系统状态', value: 'status', icon: <InfoCircleOutlined /> },
                  ]}
                  value={rightPanelMode}
                  onChange={(val: any) => setRightPanelMode(val)}
                />
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchPreview} 
                  loading={previewLoading}
                  type="primary"
                  ghost
                >
                  刷新预览
                </Button>
              </div>
            </Card>

            {rightPanelMode === 'preview' && (
              <div style={{ flex: 1, border: '1px solid #d9d9d9', background: '#525659', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                {previewLoading ? (
                  <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: 'white' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>正在生成 PDF 预览...</div>
                  </div>
                ) : pdfUrl ? (
                  <iframe 
                    src={pdfUrl} 
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} 
                    title="PDF Preview"
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ccc' }}>
                    <Text style={{ color: '#ccc' }}>点击“刷新预览”查看效果</Text>
                  </div>
                )}
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* 上传文件 Modal */}
      <Modal
        title="上传文件到资料库"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>选择文件夹：</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categories.map(cat => ({ label: cat, value: cat }))}
            />
          </div>

          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域</p>
            <p className="ant-upload-hint">
              支持 PDF、Word、Excel、图片等格式<br />
              文件将上传到：<Text strong style={{ color: '#1890ff' }}>{selectedCategory}</Text>
            </p>
          </Dragger>

          <Alert
            message={`已选择文件夹：${selectedCategory}`}
            type="info"
            showIcon
            icon={<FolderOutlined />}
          />
        </Space>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
