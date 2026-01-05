import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, DatePicker, Button, Card, Typography, Space, Divider, message, Row, Col, Alert, Steps, Segmented, Spin, List, Upload, Empty } from 'antd';
import { MinusCircleOutlined, PlusOutlined, DownloadOutlined, FileTextOutlined, CloudUploadOutlined, CheckCircleOutlined, EyeOutlined, InfoCircleOutlined, ReloadOutlined, SaveOutlined, ArrowLeftOutlined, InboxOutlined, FilePdfOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import PreviewReport from './PreviewReport';

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
  
  const [rightPanelMode, setRightPanelMode] = useState<'preview' | 'status'>('preview');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [form] = Form.useForm();
  
  // 实时监听表单数据，用于预览
  const watchedValues = Form.useWatch([], form);

  // 初始化加载项目数据
  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:8000/api/projects/${id}`);
        setProjectData(res.data);
        setFiles(res.data.files);
        
        // 填充表单
        const formData = { ...res.data.data };
        // 处理日期格式
        ['report_date', 'start_date', 'end_date'].forEach(key => {
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
    contract_amount: parseFloat(values.contract_amount || 0),
    submit_amount_wan: parseFloat(values.submit_amount_wan || 0),
    audit_amount: parseFloat(values.audit_amount || 0),
    final_approved_amount: parseFloat(values.final_approved_amount || 0),
    reduction_amount: parseFloat(values.reduction_amount || 0),
  });

  // 保存数据
  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      const formattedData = formatData(values);
      await axios.put(`http://localhost:8000/api/projects/${id}/save`, { data: formattedData });
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
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
      
      const response = await axios.post('http://localhost:8000/api/preview', { data: formattedData }, {
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
      await axios.put(`http://localhost:8000/api/projects/${id}/save`, { data: formattedData });

      const response = await axios.post('http://localhost:8000/api/generate', { data: formattedData }, {
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

  // 文件上传配置
  const uploadProps = {
    name: 'file',
    multiple: true,
    action: `http://localhost:8000/api/projects/${id}/upload`,
    onChange(info: any) {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} 上传成功.`);
        // 刷新文件列表
        const newFile = info.file.response;
        setFiles(prev => [...prev, newFile]);
      } else if (status === 'error') {
        message.error(`${info.file.name} 上传失败.`);
      }
    },
    showUploadList: false, // 我们自己渲染列表
  };

  const handleDeleteFile = async (fileId: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/files/${fileId}`);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      message.success('文件已删除');
    } catch (e) {
      message.error('删除失败');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>;

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '16px' }}>
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
           <Card title="项目资料库" bordered={false} style={{ height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
             <Dragger {...uploadProps} style={{ marginBottom: 16 }}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽上传</p>
                <p className="ant-upload-hint">支持 PDF, Word, Excel, 图片</p>
              </Dragger>
              
              <List
                size="small"
                dataSource={files}
                locale={{ emptyText: '暂无文件' }}
                renderItem={(item: any) => (
                  <List.Item
                    actions={[<DeleteOutlined style={{ color: 'red' }} onClick={() => handleDeleteFile(item.id)} />]}
                  >
                    <List.Item.Meta
                      avatar={<FilePdfOutlined />}
                      title={<Text ellipsis={{ tooltip: item.filename }}>{item.filename}</Text>}
                      description={dayjs(item.uploaded_at).format('MM-DD HH:mm')}
                    />
                  </List.Item>
                )}
              />
              
              <Alert 
                message="AI 自动提取" 
                description="上传资料后，点击此处可一键提取信息（开发中...）" 
                type="info" 
                style={{ marginTop: 16 }}
              />
           </Card>
        </Col>

        {/* 中间：表单 (40%) */}
        <Col xs={24} xl={10} xxl={10}>
          <Card title={<Space><FileTextOutlined /><span>信息录入</span></Space>} bordered={false} style={{ height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
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

              {/* 3. 工期与金额 */}
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
                 <Col span={8}>
                  <Form.Item label="核准金额(元)" name="audit_amount" rules={[{ required: true }]}>
                    <InputNumber prefix="¥" style={{ width: '100%' }} precision={2} />
                  </Form.Item>
                </Col>
                 <Col span={8}>
                  <Form.Item label="最终审定(元)" name="final_approved_amount" rules={[{ required: true }]}>
                    <InputNumber prefix="¥" style={{ width: '100%' }} precision={2} />
                  </Form.Item>
                </Col>
                 <Col span={8}>
                  <Form.Item label="核减金额(元)" name="reduction_amount" rules={[{ required: true }]}>
                    <InputNumber prefix="¥" style={{ width: '100%' }} precision={2} style={{ color: '#cf1322', fontWeight: 'bold' }} />
                  </Form.Item>
                </Col>
              </Row>

              {/* 4. 调整原因 */}
              <Divider orientation="left" plain>核增核减原因说明</Divider>
              <Form.List name="adjustments">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                        <Col flex="auto">
                          <Form.Item
                            {...restField}
                            name={[name, 'content']}
                            noStyle
                          >
                            <Input placeholder="调整原因描述" />
                          </Form.Item>
                        </Col>
                        <Col flex="100px">
                          <Form.Item
                            {...restField}
                            name={[name, 'amount']}
                            noStyle
                          >
                            <InputNumber placeholder="金额(万)" precision={2} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col flex="32px">
                          <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#999', cursor: 'pointer' }} />
                        </Col>
                      </Row>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        添加原因
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
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
    </div>
  );
};

export default ProjectDetail;
