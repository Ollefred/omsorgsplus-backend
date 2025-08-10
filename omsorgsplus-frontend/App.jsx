import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('Laddar...')

  useEffect(() => {
    fetch('/api/test') // går via Vite-proxy till backend
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage('Kunde inte hämta från backend'))
  }, [])

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Test från backend:</h1>
      <p>{message}</p>
    </div>
  )
}

export default App

