from docxtpl import DocxTemplate
import os

# Define paths
template_path = 'report_template.docx'
output_path = 'debug_report_short_name.docx'

# Load template
tpl = DocxTemplate(template_path)

# Context with a very short project name
context = {
    "project_name": "短名",
    "report_date": "2026年01月05日",
    "report_code": "Test-001",
    # Fill other required fields with dummy data to avoid errors if they are used
    "client_name": "Client",
    "project_description": "Desc",
    "builder_name": "Builder",
    "designer_name": "Designer",
    "contractor_name": "Contractor",
    "supervisor_name": "Supervisor",
    "agent_name": "Agent",
    "duration_days": "100",
    "start_date": "2024-01-01",
    "end_date": "2024-04-01",
    "contract_amount": "100",
    "submit_amount_wan": "100",
    "audit_amount": "100",
    "final_approved_amount": "100",
    "reduction_amount": "0",
    "adjustments": []
}

# Render and save
tpl.render(context)
tpl.save(output_path)
print(f"Generated {output_path}")
