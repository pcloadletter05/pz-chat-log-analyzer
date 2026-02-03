import { useState } from 'react'
import './App.css'

function App() {
  const [parsedMessages, setParsedMessages] = useState<string[]>([])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        parseLog(text)
      }
      reader.readAsText(file)
    }
  }

  const parseLog = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '')
    setParsedMessages(lines)
  }

  return (
    <div className="app">
      <h1>PZ Chat Log Analyzer</h1>
      <div className="upload-section">
        <label htmlFor="log-upload" className="upload-label">
          Upload Chat Log File
        </label>
        <input
          id="log-upload"
          type="file"
          accept=".txt,.log"
          onChange={handleFileUpload}
        />
      </div>
      {parsedMessages.length > 0 && (
        <div className="results">
          <h2>Parsed Messages ({parsedMessages.length})</h2>
          <div className="message-list">
            {parsedMessages.map((msg, index) => (
              <div key={index} className="message">
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App