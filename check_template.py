from docxtpl import DocxTemplate
import os

template_path = 'report_template.docx'

try:
    tpl = DocxTemplate(template_path)
    print(f"Template loaded successfully: {template_path}")
    
    # render with dummy data to check for errors
    context = {
        "project_name": "TEST PROJECT",
        "report_date": "2026年01月01日",
        "report_code": "TEST-001",
        # Add minimal required fields
        "client_name": "Client",
        "project_description": "Desc",
        "builder_name": "Builder",
        "designer_name": "Designer",
        "contractor_name": "Contractor",
        "supervisor_name": "Supervisor",
        "agent_name": "Agent",
        "duration_days": 100,
        "start_date": "2024-01-01",
        "end_date": "2024-04-01",
        "contract_amount": 100,
        "submit_amount_wan": 100,
        "audit_amount": 100,
        "final_approved_amount": 100,
        "reduction_amount": 0,
        "adjustments": []
    }
    
    tpl.render(context)
    tpl.save('test_render_output.docx')
    print("Render successful")
    
    # Try converting to PDF using the command from server.py
    import subprocess
    cmd = [
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
        "--headless",
        "--convert-to", "pdf",
        "--outdir", ".",
        "test_render_output.docx"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print("PDF conversion successful")
    else:
        print(f"PDF conversion failed: {result.stderr}")

except Exception as e:
    print(f"Error: {e}")
