import { ArrowLeft, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

// 折叠组件
function Collapsible({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="my-4 border border-dark-600 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-dark-700 hover:bg-dark-600 transition-colors text-left"
      >
        <span className="font-medium text-cyan-400">{title}</span>
        {isOpen ? (
          <ChevronDown size={20} className="text-gray-400" />
        ) : (
          <ChevronRight size={20} className="text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-dark-800 border-t border-dark-600">
          {children}
        </div>
      )}
    </div>
  );
}

// 渲染单行 Markdown
function renderLine(line, key) {
  // 标题处理
  if (line.startsWith("### ")) {
    return (
      <h3 key={key} className="text-lg font-bold text-cyan-400 mt-6 mb-3">
        {line.slice(4)}
      </h3>
    );
  }
  if (line.startsWith("## ")) {
    return (
      <h2 key={key} className="text-xl font-bold text-cyan-300 mt-8 mb-4">
        {line.slice(3)}
      </h2>
    );
  }
  if (line.startsWith("# ")) {
    return (
      <h1 key={key} className="text-2xl font-bold text-white mb-6">
        {line.slice(2)}
      </h1>
    );
  }
  // 列表处理
  if (line.startsWith("- ") || line.startsWith("* ")) {
    return (
      <li key={key} className="text-gray-300 ml-4">
        {line.slice(2)}
      </li>
    );
  }
  if (/^\d+\.\s/.test(line)) {
    return (
      <li key={key} className="text-gray-300 ml-4 list-decimal">
        {line.replace(/^\d+\.\s/, "")}
      </li>
    );
  }
  // 分隔线
  if (line.trim() === "---") {
    return <hr key={key} className="my-6 border-dark-600" />;
  }
  // 空行
  if (line.trim() === "") {
    return <br key={key} />;
  }
  // 普通段落
  return (
    <p key={key} className="text-gray-300 leading-relaxed mb-2">
      {line}
    </p>
  );
}

// 解析内容，处理折叠块
function parseContent(content) {
  const blocks = [];
  const lines = content.split("\n");
  let i = 0;
  let blockIndex = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 检测折叠块开始: <details>
    if (line.trim() === "<details>") {
      // 找标题（下一行应该是标题）
      let title = "展开查看";
      let contentLines = [];
      i++;

      // 获取标题
      if (i < lines.length) {
        const titleLine = lines[i].trim();
        if (
          titleLine.startsWith("### ") ||
          titleLine.startsWith("## ") ||
          titleLine.startsWith("# ")
        ) {
          title = titleLine.replace(/^#+\s*/, "");
          i++;
        }
      }

      // 收集折叠块内容直到 </details>
      while (i < lines.length && lines[i].trim() !== "</details>") {
        contentLines.push(lines[i]);
        i++;
      }

      // 跳过 </details>
      if (i < lines.length && lines[i].trim() === "</details>") {
        i++;
      }

      blocks.push({
        type: "collapsible",
        title,
        content: contentLines,
        key: blockIndex++,
      });
    } else {
      // 普通行
      blocks.push({
        type: "line",
        content: line,
        key: blockIndex++,
      });
      i++;
    }
  }

  return blocks;
}

export default function Tutorial() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    api
      .get("/api/manage/tutorial")
      .then((res) => {
        if (res.data.enabled) {
          setEnabled(true);
          setContent(res.data.content || "");
        } else {
          navigate("/");
        }
      })
      .catch(() => {
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!enabled) {
    return null;
  }

  const blocks = parseContent(content);

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* 导航栏 */}
      <nav className="bg-dark-800 border-b border-dark-600 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
            返回
          </Link>
          <div className="flex items-center gap-2 text-cyan-400">
            <BookOpen size={20} />
            <span className="font-semibold">使用教程</span>
          </div>
        </div>
      </nav>

      {/* 教程内容 */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 md:p-8">
          <div className="prose prose-invert prose-cyan max-w-none">
            {blocks.map((block) => {
              if (block.type === "collapsible") {
                return (
                  <Collapsible key={block.key} title={block.title}>
                    {block.content.map((line, i) =>
                      renderLine(line, `${block.key}-${i}`),
                    )}
                  </Collapsible>
                );
              }
              return renderLine(block.content, block.key);
            })}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              localStorage.setItem("hasReadTutorial", "true");
              navigate("/");
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium"
          >
            我已阅读，开始使用
          </button>
        </div>
      </main>
    </div>
  );
}
