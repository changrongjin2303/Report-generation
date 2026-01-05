import React from 'react';
import { Descriptions, Table, Typography, Divider } from 'antd';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

interface PreviewProps {
  data: any;
}

const PreviewReport: React.FC<PreviewProps> = ({ data }) => {
  if (!data) return null;

  // 辅助函数：处理金额显示
  const formatMoney = (val: number | undefined) => 
    val !== undefined ? val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
  
  // 辅助函数：处理日期
  const formatDate = (val: any) => 
    val ? dayjs(val).format('YYYY年MM月DD日') : '____年__月__日';

  return (
    <div 
      style={{ 
        width: '100%', 
        background: 'white', 
        padding: '40px', 
        minHeight: '800px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontFamily: '"SimSun", "Songti SC", serif', // 尝试模拟宋体
        color: '#000',
        fontSize: '14px',
        lineHeight: '1.8'
      }}
    >
      {/* 模拟封面 */}
      <div style={{ textAlign: 'center', marginBottom: '60px', borderBottom: '1px dashed #eee', paddingBottom: '20px' }}>
        <Title level={3} style={{ marginTop: 40, fontFamily: 'inherit' }}>工程造价咨询报告书</Title>
        <Paragraph style={{ fontSize: '12px', color: '#999' }}>（此处为预览效果，仅供参考，排版以最终 Word 为准）</Paragraph>
        
        <div style={{ marginTop: 60, textAlign: 'left', marginLeft: '20%' }}>
          <p><strong>项目名称：</strong> {data.project_name || '________________'}</p>
          <p><strong>报告编号：</strong> {data.report_code || '________________'}</p>
          <p><strong>报告日期：</strong> {formatDate(data.report_date)}</p>
        </div>
      </div>

      {/* 正文模拟 */}
      <div>
        <Title level={4} style={{ textAlign: 'center', fontFamily: 'inherit', marginBottom: 20 }}>审核报告单</Title>
        
        <p><strong>{data.client_name || '（委托方名称）'}</strong>：</p>
        
        <p style={{ textIndent: '2em' }}>
          本公司接受委托，对 <strong>{data.project_name}</strong> 的工程结算进行了审核。
          {data.project_description ? `工程概况：${data.project_description}` : ''}
        </p>

        <div style={{ margin: '20px 0', padding: '10px', background: '#f9f9f9', border: '1px solid #eee' }}>
          <p><strong>建设单位：</strong> {data.builder_name}</p>
          <p><strong>施工单位：</strong> {data.contractor_name}</p>
          <p><strong>合同工期：</strong> {data.duration_days} 天</p>
          <p><strong>开工日期：</strong> {formatDate(data.start_date)}</p>
          <p><strong>竣工日期：</strong> {formatDate(data.end_date)}</p>
        </div>

        <p style={{ textIndent: '2em' }}>
          工程合同金额为 <strong>{formatMoney(data.contract_amount)}</strong> 万元；
          送审结算金额为 <strong>{formatMoney(data.submit_amount_wan)}</strong> 万元。
        </p>

        <p style={{ textIndent: '2em', marginTop: '10px' }}>
          经审核，最终核准金额为 <strong>{formatMoney(data.audit_amount)}</strong> 元，
          核减金额 <strong>{formatMoney(data.reduction_amount)}</strong> 元。
        </p>

        <p><strong>主要核增核减原因：</strong></p>
        <ul style={{ paddingLeft: '20px' }}>
          {data.adjustments && data.adjustments.length > 0 ? (
            data.adjustments.map((item: any, index: number) => (
              <li key={index}>
                {item.content || '...'}，
                造价核减 {formatMoney(item.amount)} 万元
              </li>
            ))
          ) : (
            <li>（暂无调整项）</li>
          )}
        </ul>

      </div>
    </div>
  );
};

export default PreviewReport;
