import { useState, useRef, useEffect } from "react"
import axios from "axios"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { supabase } from "./supabase"
import Login from "./Login"
import "./App.css"

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export default function App() {
  const [session, setSession] = useState(null)
  const [question, setQuestion] = useState("")
  const [sql, setSql] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState("")
  const [history, setHistory] = useState([])
  const [myFiles, setMyFiles] = useState([])
  const [activeTab, setActiveTab] = useState("query")
  const [source, setSource] = useState("sample_db")
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchHistory(session.access_token)
        fetchMyFiles(session.access_token)
      }
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchHistory(session.access_token)
        fetchMyFiles(session.access_token)
      }
    })
  }, [])

  const fetchHistory = async (token) => {
    try {
      const res = await axios.get(`${API}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHistory(res.data)
    } catch {}
  }

  const fetchMyFiles = async (token) => {
    try {
      const res = await axios.get(`${API}/my-files`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMyFiles(res.data)
    } catch {}
  }

  const askQuestion = async (q, src = source, tbl = selectedFile?.table_name) => {
    if (!q.trim()) return
    setLoading(true)
    setError("")
    setSql("")
    setResult(null)
    try {
      const res = await axios.post(`${API}/ask`,
        { question: q, source: src, table_name: tbl },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      setSql(res.data.sql)
      setResult(res.data.result)
      fetchHistory(session.access_token)
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong.")
    }
    setLoading(false)
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    audioChunks.current = []
    mediaRecorder.current.ondataavailable = e => audioChunks.current.push(e.data)
    mediaRecorder.current.onstop = async () => {
      const blob = new Blob(audioChunks.current, { type: "audio/webm" })
      const formData = new FormData()
      formData.append("file", blob, "recording.webm")
      setLoading(true)
      try {
        const res = await axios.post(`${API}/transcribe`, formData, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        const text = res.data.text
        setQuestion(text)
        await askQuestion(text)
      } catch {
        setError("Audio transcription failed.")
      }
      setLoading(false)
    }
    mediaRecorder.current.start()
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorder.current.stop()
    setRecording(false)
  }

  const downloadExcel = () => {
    if (!result) return
    const ws = XLSX.utils.aoa_to_sheet([result.columns, ...result.rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Results")
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    saveAs(new Blob([buf]), `nl2sql_results_${Date.now()}.xlsx`)
  }

  const copySQL = () => {
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const uploadExcel = async (file) => {
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await axios.post(`${API}/upload-excel`, formData, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      fetchMyFiles(session.access_token)
      alert(`✅ Uploaded! ${res.data.row_count} rows loaded.`)
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.detail || err.message))
    }
    setUploading(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setHistory([])
    setMyFiles([])
  }

  if (!session) return <Login />

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <img src="/logo.png" alt="QueryGenie" style={{width: "36px", height: "36px", borderRadius: "8px"}} />
          <h1>QueryGenie</h1>
        </div>  
        <div className="header-right">
          <span className="user-email">{session.user.email}</span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={activeTab === "query" ? "active" : ""} onClick={() => setActiveTab("query")}>🔍 Query</button>
        <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>📜 History</button>
        <button className={activeTab === "files" ? "active" : ""} onClick={() => setActiveTab("files")}>📁 My Files</button>
      </div>

      {/* Query Tab */}
      {activeTab === "query" && (
        <div className="query-tab">
          {/* Source selector */}
          <div className="source-selector">
            <button
              className={source === "sample_db" ? "active" : ""}
              onClick={() => { setSource("sample_db"); setSelectedFile(null) }}
            >🗃️ Sample DB</button>
            <button
              className={source === "excel" ? "active" : ""}
              onClick={() => setSource("excel")}
            >📊 My Excel</button>
          </div>

          {/* Excel file picker */}
          {source === "excel" && (
            <div className="file-picker">
              {myFiles.length === 0 ? (
                <p className="no-files">No files uploaded yet. Go to My Files tab to upload!</p>
              ) : (
                <select onChange={e => {
                  const f = myFiles.find(f => f.table_name === e.target.value)
                  setSelectedFile(f)
                }}>
                  <option value="">-- Select a file --</option>
                  {myFiles.map(f => (
                    <option key={f.id} value={f.table_name}>{f.file_name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Search box */}
          <div className="search-box">
            <input
              type="text"
              placeholder="e.g. Show all employees in Engineering department"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && askQuestion(question)}
            />
            <button 
              onClick={() => askQuestion(question)} 
              disabled={loading || (source === "excel" && !selectedFile)}
            >
              {loading ? "..." : "Ask"}
            </button>
            <button
              className={recording ? "recording" : "mic"}
              onClick={recording ? stopRecording : startRecording}
            >
              {recording ? "⏹ Stop" : "🎤 Speak"}
            </button>
          </div>

          {error && <div className="error">{error}</div>}

          {/* SQL Result */}
          {sql && (
            <div className="section">
              <div className="section-header">
                <h2>Generated SQL</h2>
                <button className="copy-btn" onClick={copySQL}>
                  {copied ? "✅ Copied!" : "📋 Copy SQL"}
                </button>
              </div>
              <SyntaxHighlighter language="sql" style={oneDark}>
                {sql}
              </SyntaxHighlighter>
            </div>
          )}

          {/* Table Result */}
          {result && (
            <div className="section">
              <div className="section-header">
                <h2>Results <span>{result.rows.length} rows</span></h2>
                <button className="download-btn" onClick={downloadExcel}>
                  ⬇️ Download Excel
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>{result.columns.map(col => <th key={col}>{col}</th>)}</tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i}>{row.map((cell, j) => <td key={j}>{String(cell)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="history-tab">
          <h2>📜 Query History</h2>
          {history.length === 0 ? (
            <p className="empty">No history yet. Start asking questions!</p>
          ) : (
            history.map(h => (
              <div key={h.id} className="history-card" onClick={() => {
                setQuestion(h.question)
                setActiveTab("query")
                askQuestion(h.question, h.source)
              }}>
                <div className="history-question">💬 {h.question}</div>
                <div className="history-sql">{h.sql_query}</div>
                <div className="history-meta">
                  <span>{h.row_count} rows</span>
                  <span>{h.source}</span>
                  <span>{new Date(h.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* My Files Tab */}
      {activeTab === "files" && (
        <div className="files-tab">
          <h2>📁 My Files</h2>

          {/* Upload box */}
          <div className="upload-box">
            <p>Upload Excel or CSV to query with NL</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={e => uploadExcel(e.target.files[0])}
              disabled={uploading}
            />
            {uploading && <p className="uploading">⏳ Uploading...</p>}
          </div>

          {/* Files list */}
          {myFiles.length === 0 ? (
            <p className="empty">No files uploaded yet.</p>
          ) : (
            myFiles.map(f => (
              <div key={f.id} className="file-card" onClick={() => {
                setSelectedFile(f)
                setSource("excel")
                setActiveTab("query")
              }}>
                <div className="file-name">📊 {f.file_name}</div>
                <div className="file-meta">
                  <span>{f.row_count} rows</span>
                  <span>{f.columns?.split(",").length} columns</span>
                  <span>{new Date(f.created_at).toLocaleString()}</span>
                </div>
                <div className="file-cols">{f.columns}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}






