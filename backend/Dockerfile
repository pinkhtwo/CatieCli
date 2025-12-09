FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 复制代码
COPY . .

# 创建数据目录
RUN mkdir -p /app/data

# 默认端口（Zeabur 默认 8080，可通过环境变量 PORT 覆盖）
ENV PORT=8080
EXPOSE 8080

# 启动命令（使用 shell 形式以支持环境变量）
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
