from docxtpl import DocxTemplate
import datetime

def generate_test_report():
    # 1. 加载模板 (确保你已经修改并保存了 report_template.docx)
    tpl = DocxTemplate('/Users/crj/Documents/code/baogao_code/report_template.docx')
    
    # 2. 准备模拟数据 (这些数据未来将由 AI 从合同和结算书中提取)
    context = {
        "project_name": "江南大道及两侧楼宇景观亮化提升工程",
        "report_date": "2026年01月04日",
        "report_code": "杭滨咨(2026)结审第001号",
        "client_name": "杭州市滨江区城市建设投资集团有限公司",
        "project_description": "本工程主要包括江南大道（西兴路-火炬大道）及周边楼宇的亮化设计与施工，涉及灯具安装 1200 套，控制系统升级等内容。",
        "builder_name": "杭州市滨江区城市建设投资集团有限公司",
        "designer_name": "中国联合工程有限公司",
        "contractor_name": "浙江省一建建设集团有限公司",
        "supervisor_name": "杭州市建设工程监理有限公司",
        "agent_name": "杭州市滨江区代建中心",
        "duration_days": "365",
        "start_date": "2024年05月01日",
        "end_date": "2025年05月01日",
        "contract_amount": "1500.25",
        "submit_amount_wan": "1550.80",
        "audit_amount": "14,800,000.00",
        "final_approved_amount": "14,750,000.00",
        "reduction_amount": "758,000.00",
        "adjustments": [
            {"content": "C30混凝土工程量按实调减", "amount": "12.50"},
            {"content": "亮化灯具品牌更换核减差价", "amount": "8.30"},
            {"content": "取消部分不必要的装饰挂件", "amount": "5.20"}
        ]
    }
    
    # 3. 渲染模板
    try:
        tpl.render(context)
        # 4. 保存结果
        output_path = '/Users/crj/Documents/code/baogao_code/generated_report_test.docx'
        tpl.save(output_path)
        print(f"成功生成报告：{output_path}")
    except Exception as e:
        print(f"渲染出错: {e}")

if __name__ == "__main__":
    generate_test_report()
