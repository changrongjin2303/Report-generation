from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, Session, SQLModel, create_engine, select, Relationship
from docxtpl import DocxTemplate
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import uuid
import json
import shutil
import subprocess

# --- 配置 ---
BASE_DIR = "/Users/crj/Documents/code/baogao_code"
DB_FILE = os.path.join(BASE_DIR, "database.db")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
TMP_DIR = os.path.join(BASE_DIR, "tmp_reports")
TEMPLATE_PATH = os.path.join(BASE_DIR, "report_template.docx")

# 确保目录存在
for d in [UPLOAD_DIR, TMP_DIR]:
    if not os.path.exists(d):
        os.makedirs(d)

# --- 数据库模型 (SQLModel) ---
class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    code: str = "" # 项目编号
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    # 存储表单数据的 JSON 字符串
    data_json: str = "{}" 
    
    # 关联文件
    files: List["ProjectFile"] = Relationship(back_populates="project")

class ProjectFile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id")
    filename: str
    filepath: str
    file_type: str = "other" # contract, settlement, etc.
    uploaded_at: datetime = Field(default_factory=datetime.now)
    
    project: Optional[Project] = Relationship(back_populates="files")

# 数据库连接
sqlite_url = f"sqlite:///{DB_FILE}"
engine = create_engine(sqlite_url)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

# --- FastAPI App ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# --- Pydantic Models for API (请求/响应) ---
class ProjectCreate(SQLModel):
    name: str
    code: Optional[str] = ""

class ProjectRead(SQLModel):
    id: int
    name: str
    code: str
    created_at: datetime
    updated_at: datetime

class ProjectDetail(ProjectRead):
    data: Dict[str, Any] # 解析后的 JSON 对象
    files: List[ProjectFile]

class SaveDataRequest(SQLModel):
    data: Dict[str, Any]

# --- 辅助函数 ---
def generate_docx_file(data: dict, filename_prefix: str) -> str:
    if not os.path.exists(TEMPLATE_PATH):
        raise FileNotFoundError("Template file not found")
    
    tpl = DocxTemplate(TEMPLATE_PATH)
    tpl.render(data)
    
    filename = f"{filename_prefix}_{uuid.uuid4()}.docx"
    file_path = os.path.join(TMP_DIR, filename)
    tpl.save(file_path)
    return file_path

# --- API 接口 ---

# 1. 项目管理接口
@app.post("/api/projects", response_model=ProjectRead)
def create_project(project: ProjectCreate, session: Session = Depends(get_session)):
    # 使用 model_dump() 确保兼容性
    db_project = Project(**project.model_dump())
    # 初始化默认数据结构（带测试数据）
    default_data = {
        "project_name": project.name,
        "report_code": project.code or "杭滨咨(2026)结审第001号",
        "report_date": datetime.now().strftime("%Y年%m月%d日"),
        "client_name": "杭州市滨江区城市建设投资集团有限公司",
        "project_description": "本工程主要包括江南大道（西兴路-火炬大道）及周边楼宇的亮化设计与施工，涉及灯具安装 1200 套，控制系统升级等内容。",
        "builder_name": "杭州市滨江区城市建设投资集团有限公司",
        "designer_name": "中国联合工程有限公司",
        "contractor_name": "浙江省一建建设集团有限公司",
        "supervisor_name": "杭州市建设工程监理有限公司",
        "agent_name": "杭州市滨江区代建中心",
        "duration_days": 365,
        "start_date": "2024年05月01日",
        "end_date": "2025年05月01日",
        "contract_amount": 1500.00,
        "submit_amount_wan": 1550.00,
        "audit_amount": 14800000.00,
        "final_approved_amount": 14750000.00,
        "reduction_amount": 758000.00,
        "adjustments": [
            {"content": "C30混凝土工程量按实调减", "amount": 12.50},
            {"content": "亮化灯具品牌更换核减差价", "amount": 8.30}
        ]
    }
    db_project.data_json = json.dumps(default_data, ensure_ascii=False)
    session.add(db_project)
    session.commit()
    session.refresh(db_project)
    return db_project

@app.get("/api/projects", response_model=List[ProjectRead])
def read_projects(session: Session = Depends(get_session)):
    projects = session.exec(select(Project).order_by(Project.created_at.desc())).all()
    return projects

@app.get("/api/projects/{project_id}", response_model=ProjectDetail)
def read_project_detail(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 构造详情响应，将 data_json 解析为 dict
    try:
        data_obj = json.loads(project.data_json)
    except:
        data_obj = {}
        
    return ProjectDetail(
        id=project.id,
        name=project.name,
        code=project.code,
        created_at=project.created_at,
        updated_at=project.updated_at,
        data=data_obj,
        files=project.files
    )

@app.put("/api/projects/{project_id}/save")
def save_project_data(project_id: int, request: SaveDataRequest, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 更新数据
    project.data_json = json.dumps(request.data, ensure_ascii=False)
    project.updated_at = datetime.now()
    session.add(project)
    session.commit()
    return {"status": "success"}

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    session.delete(project)
    session.commit()
    return {"status": "deleted"}

# 2. 文件上传接口
@app.post("/api/projects/{project_id}/upload")
async def upload_file(project_id: int, file: UploadFile = File(...), session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 保存文件
    # 为避免重名，加个 UUID 前缀
    safe_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 记录到数据库
    db_file = ProjectFile(
        project_id=project_id,
        filename=file.filename, # 原始文件名用于展示
        filepath=file_path,
        file_type="file" # 后续可根据后缀名优化
    )
    session.add(db_file)
    session.commit()
    session.refresh(db_file)
    return db_file

@app.delete("/api/files/{file_id}")
def delete_file(file_id: int, session: Session = Depends(get_session)):
    file_rec = session.get(ProjectFile, file_id)
    if not file_rec:
        raise HTTPException(status_code=404, detail="File not found")
    
    # 删除物理文件
    if os.path.exists(file_rec.filepath):
        os.remove(file_rec.filepath)
        
    session.delete(file_rec)
    session.commit()
    return {"status": "deleted"}

# 3. 生成与预览接口 (复用之前的逻辑，但现在接收任意 JSON)
@app.post("/api/generate")
async def generate_report(request: SaveDataRequest):
    """直接接收 JSON 数据生成 Word (不依赖数据库)"""
    try:
        file_path = generate_docx_file(request.data, "report")
        return FileResponse(file_path, filename="审核报告.docx", media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    except Exception as e:
        print(f"Gen Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/preview")
async def preview_report(request: SaveDataRequest):
    """直接接收 JSON 数据生成 PDF 预览"""
    try:
        # print(f"DEBUG Preview Data: {json.dumps(request.data, ensure_ascii=False)}")
        
        # 1. 生成 Word
        docx_path = generate_docx_file(request.data, "preview")
        
        # 2. 调用 LibreOffice 转 PDF
        # 设置环境变量，解决 macOS 下可能的配置加载问题
        env = os.environ.copy()
        env["HOME"] = TMP_DIR 
        
        cmd = [
            "/Applications/LibreOffice.app/Contents/MacOS/soffice",
            "--headless",
            "--convert-to", "pdf",
            "--outdir", TMP_DIR,
            docx_path
        ]
        
        # 增加 timeout 防止死锁
        process = subprocess.run(cmd, capture_output=True, text=True, env=env, timeout=30)
        
        if process.returncode != 0:
            print(f"LibreOffice Error: {process.stderr}")
            print(f"LibreOffice Stdout: {process.stdout}")
            raise Exception("PDF Conversion failed")
            
        pdf_filename = os.path.basename(docx_path).replace(".docx", ".pdf")
        pdf_path = os.path.join(TMP_DIR, pdf_filename)
        
        if not os.path.exists(pdf_path):
            raise Exception("PDF file not generated")
            
        return FileResponse(pdf_path, media_type="application/pdf")

    except Exception as e:
        print(f"Preview Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)