#!/usr/bin/env python3
"""
修复Word模板中表格的行高设置，使其能够根据内容自动调整
"""

from docx import Document
from docx.oxml.ns import qn
from docx.oxml import parse_xml
from docx.shared import Pt

def fix_table_row_heights():
    """修改所有表格行高为自动调整"""
    template_path = "/Users/crj/Documents/code/baogao_code/report_template.docx"
    backup_path = "/Users/crj/Documents/code/baogao_code/report_template_rowheight_backup.docx"

    print("🔍 正在读取模板文件...")
    doc = Document(template_path)

    # 备份原模板
    doc.save(backup_path)
    print(f"✅ 已备份原模板到: {backup_path}")

    # 遍历文档中的所有表格
    table_count = 0
    row_count = 0

    for table in doc.tables:
        table_count += 1
        print(f"\n📊 处理表格 {table_count}...")

        for row_idx, row in enumerate(table.rows):
            row_count += 1

            # 获取行的XML元素
            tr = row._tr
            trPr = tr.get_or_add_trPr()

            # 移除固定行高设置（如果存在）
            trHeight = trPr.find(qn('w:trHeight'))
            if trHeight is not None:
                # 检查当前行高规则
                height_rule = trHeight.get(qn('w:hRule'))
                height_val = trHeight.get(qn('w:val'))

                print(f"   行 {row_idx + 1}: 当前规则={height_rule}, 高度={height_val}")

                # 设置为自动行高（hRule="auto"）
                # 或者设置为"至少"模式（hRule="atLeast"）
                trHeight.set(qn('w:hRule'), 'auto')  # 'auto' 或 'atLeast'

                print(f"   ✅ 已修改为自动行高")
            else:
                # 如果没有行高设置，添加自动行高
                trHeight = parse_xml(r'<w:trHeight {} w:hRule="auto"/>'.format(
                    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
                ))
                trPr.append(trHeight)
                print(f"   行 {row_idx + 1}: 添加自动行高设置")

            # 确保单元格内允许自动换行
            for cell in row.cells:
                # 设置单元格允许换行
                tcPr = cell._element.get_or_add_tcPr()

                # 移除不换行设置（如果有）
                noWrap = tcPr.find(qn('w:noWrap'))
                if noWrap is not None:
                    tcPr.remove(noWrap)

    print(f"\n✅ 共处理 {table_count} 个表格，{row_count} 行")

    # 保存修改后的模板
    doc.save(template_path)
    print(f"✅ 模板行高已修复！")
    print(f"✅ 修改后的模板: {template_path}")
    print(f"💡 如需恢复，请使用备份文件: {backup_path}")

if __name__ == "__main__":
    try:
        fix_table_row_heights()
        print("\n✨ 修复完成！请重启服务并测试生成报告")
    except Exception as e:
        print(f"❌ 修复失败: {e}")
        import traceback
        traceback.print_exc()
