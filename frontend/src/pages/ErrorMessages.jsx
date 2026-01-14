import { ArrowLeft, Edit2, FlaskConical, Plus, Save, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function ErrorMessages() {
  const [configs, setConfigs] = useState([])
  const [errorTypes, setErrorTypes] = useState([])
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newConfig, setNewConfig] = useState({ error_type: '', keyword: '', custom_message: '', priority: 0 })
  const [testInput, setTestInput] = useState({ error_type: '', error_text: '' })
  const [testResult, setTestResult] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statusRes, configsRes] = await Promise.all([
        api.get('/api/admin/error-messages/status'),
        api.get('/api/admin/error-messages')
      ])
      setEnabled(statusRes.data.enabled)
      setErrorTypes(statusRes.data.error_types || [])
      setConfigs(configsRes.data)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const toggleEnabled = async () => {
    try {
      const res = await api.post(`/api/admin/error-messages/toggle?enabled=${!enabled}`)
      setEnabled(res.data.enabled)
    } catch (err) {
      alert('操作失败: ' + (err.response?.data?.detail || err.message))
    }
  }

  const addConfig = async () => {
    if (!newConfig.custom_message.trim()) {
      return alert('请输入自定义消息')
    }
    if (!newConfig.error_type && !newConfig.keyword) {
      return alert('错误类型和关键词至少填写一个')
    }
    try {
      await api.post('/api/admin/error-messages', newConfig)
      setNewConfig({ error_type: '', keyword: '', custom_message: '', priority: 0 })
      setShowAddForm(false)
      fetchData()
    } catch (err) {
      alert('添加失败: ' + (err.response?.data?.detail || err.message))
    }
  }

  const startEdit = (config) => {
    setEditingId(config.id)
    setEditForm({
      error_type: config.error_type || '',
      keyword: config.keyword || '',
      custom_message: config.custom_message,
      priority: config.priority,
      is_active: config.is_active
    })
  }

  const saveEdit = async () => {
    try {
      await api.put(`/api/admin/error-messages/${editingId}`, editForm)
      setEditingId(null)
      fetchData()
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.detail || err.message))
    }
  }

  const deleteConfig = async (id) => {
    if (!confirm('确定要删除这条配置吗？')) return
    try {
      await api.delete(`/api/admin/error-messages/${id}`)
      fetchData()
    } catch (err) {
      alert('删除失败: ' + (err.response?.data?.detail || err.message))
    }
  }

  const testMatch = async () => {
    if (!testInput.error_type || !testInput.error_text) {
      return alert('请填写错误类型和错误文本')
    }
    try {
      const res = await api.post('/api/admin/error-messages/test', testInput)
      setTestResult(res.data)
    } catch (err) {
      alert('测试失败: ' + (err.response?.data?.detail || err.message))
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <nav className="bg-dark-900 border-b border-dark-700">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">自定义错误消息</span>
            <span className="text-sm text-gray-500 bg-dark-700 px-2 py-0.5 rounded">管理配置</span>
          </div>
          <Link to="/admin" className="text-gray-400 hover:text-white flex items-center gap-2">
            <ArrowLeft size={20} />
            返回管理后台
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* 功能开关 */}
        <div className="bg-dark-800 rounded-xl border border-dark-600 p-4 flex items-center justify-between">
          <div>
            <h3 className="font-medium">功能开关</h3>
            <p className="text-sm text-gray-400 mt-1">
              开启后，当 API 返回错误时，将根据下方配置返回自定义友好消息
            </p>
          </div>
          <button
            onClick={toggleEnabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              enabled 
                ? 'bg-green-600 hover:bg-green-500 text-white' 
                : 'bg-dark-600 hover:bg-dark-500 text-gray-400'
            }`}
          >
            {enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            {enabled ? '已开启' : '已关闭'}
          </button>
        </div>

        {/* 测试匹配 */}
        <div className="bg-dark-800 rounded-xl border border-dark-600 p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <FlaskConical size={18} />
            测试匹配
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={testInput.error_type}
              onChange={(e) => setTestInput({ ...testInput, error_type: e.target.value })}
              className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
            >
              <option value="">选择错误类型</option>
              {errorTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="模拟错误文本..."
              value={testInput.error_text}
              onChange={(e) => setTestInput({ ...testInput, error_text: e.target.value })}
              className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500"
            />
            <button
              onClick={testMatch}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
            >
              测试
            </button>
          </div>
          {testResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              testResult.matched 
                ? 'bg-green-900/30 border border-green-500/30 text-green-300'
                : 'bg-yellow-900/30 border border-yellow-500/30 text-yellow-300'
            }`}>
              {testResult.matched ? (
                <>✅ 匹配到配置 #{testResult.config_id}: {testResult.custom_message}</>
              ) : (
                <>⚠️ 未匹配到任何配置</>
              )}
            </div>
          )}
        </div>

        {/* 配置列表 */}
        <div className="bg-dark-800 rounded-xl border border-dark-600">
          <div className="flex items-center justify-between p-4 border-b border-dark-600">
            <h3 className="font-medium">配置列表</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm"
            >
              <Plus size={16} />
              添加配置
            </button>
          </div>

          {/* 添加表单 */}
          {showAddForm && (
            <div className="p-4 border-b border-dark-600 bg-dark-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <select
                  value={newConfig.error_type}
                  onChange={(e) => setNewConfig({ ...newConfig, error_type: e.target.value })}
                  className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                >
                  <option value="">选择错误类型（可选）</option>
                  {errorTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="关键词匹配（可选）"
                  value={newConfig.keyword}
                  onChange={(e) => setNewConfig({ ...newConfig, keyword: e.target.value })}
                  className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="自定义消息"
                  value={newConfig.custom_message}
                  onChange={(e) => setNewConfig({ ...newConfig, custom_message: e.target.value })}
                  className="md:col-span-3 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500"
                />
                <input
                  type="number"
                  placeholder="优先级"
                  value={newConfig.priority}
                  onChange={(e) => setNewConfig({ ...newConfig, priority: parseInt(e.target.value) || 0 })}
                  className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addConfig}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm"
                >
                  保存
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-lg text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 表格 */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-400">加载中...</div>
            ) : configs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">暂无配置，点击上方添加</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-600 text-gray-400">
                    <th className="text-left px-4 py-3">错误类型</th>
                    <th className="text-left px-4 py-3">关键词</th>
                    <th className="text-left px-4 py-3">自定义消息</th>
                    <th className="text-left px-4 py-3">优先级</th>
                    <th className="text-left px-4 py-3">状态</th>
                    <th className="text-left px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map(c => (
                    <tr key={c.id} className="border-b border-dark-600/50 hover:bg-dark-700/30">
                      {editingId === c.id ? (
                        // 编辑模式
                        <>
                          <td className="px-4 py-3">
                            <select
                              value={editForm.error_type}
                              onChange={(e) => setEditForm({ ...editForm, error_type: e.target.value })}
                              className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs"
                            >
                              <option value="">无</option>
                              {errorTypes.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editForm.keyword}
                              onChange={(e) => setEditForm({ ...editForm, keyword: e.target.value })}
                              className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editForm.custom_message}
                              onChange={(e) => setEditForm({ ...editForm, custom_message: e.target.value })}
                              className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={editForm.priority}
                              onChange={(e) => setEditForm({ ...editForm, priority: parseInt(e.target.value) || 0 })}
                              className="w-20 px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-xs"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                              className={editForm.is_active ? 'text-green-400' : 'text-gray-500'}
                            >
                              {editForm.is_active ? '启用' : '禁用'}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={saveEdit} className="p-1.5 text-green-400 hover:bg-dark-600 rounded">
                                <Save size={16} />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-dark-600 rounded">
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        // 显示模式
                        <>
                          <td className="px-4 py-3">
                            {c.error_type ? (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                                {errorTypes.find(t => t.value === c.error_type)?.label || c.error_type}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-300">
                            {c.keyword || '-'}
                          </td>
                          <td className="px-4 py-3 text-white max-w-xs truncate">
                            {c.custom_message}
                          </td>
                          <td className="px-4 py-3 text-gray-400">
                            {c.priority}
                          </td>
                          <td className="px-4 py-3">
                            <span className={c.is_active ? 'text-green-400' : 'text-gray-500'}>
                              {c.is_active ? '启用' : '禁用'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => startEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-dark-600 rounded">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => deleteConfig(c.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-dark-600 rounded">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="bg-dark-800 rounded-xl border border-dark-600 p-4 text-sm text-gray-400">
          <h3 className="font-medium text-white mb-2">使用说明</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="text-blue-400">错误类型</span>：匹配特定类型的错误（如 NETWORK_ERROR、RATE_LIMIT）</li>
            <li><span className="text-blue-400">关键词</span>：在原始错误文本中搜索关键词（不区分大小写）</li>
            <li><span className="text-blue-400">优先级</span>：数值越大优先级越高，关键词匹配比纯类型匹配更优先</li>
            <li>两者都填时，需要同时满足才会匹配</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
