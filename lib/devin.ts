const DEVIN_API_KEY = process.env.DEVIN_API_KEY!
const DEVIN_ORG_ID = process.env.DEVIN_ORG_ID!
const BASE_URL = `https://api.devin.ai/v3/organizations/${DEVIN_ORG_ID}`

const headers = {
  'Authorization': `Bearer ${DEVIN_API_KEY}`,
  'Content-Type': 'application/json',
}

export async function createDevinSession(prompt: string): Promise<{ session_id: string; url: string }> {
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) throw new Error(`Devin session creation failed: ${res.status}`)
  return res.json()
}

export async function getDevinSession(sessionId: string): Promise<{
  session_id: string
  status: 'running' | 'exit' | 'error' | 'suspended'
  title?: string
  url: string
}> {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}`, { headers })
  if (!res.ok) throw new Error(`Failed to get session: ${res.status}`)
  return res.json()
}

export async function sendDevinMessage(sessionId: string, message: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error(`Failed to send message: ${res.status}`)
}

export async function getDevinSessionMessages(sessionId: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/messages`, { headers })
  if (!res.ok) return []
  const data = await res.json()
  return data.messages || data.items || []
}

export function parseScopeResultFromMessages(messages: any[]): any | null {
  const assistantMessages = messages.filter(m => m.role === 'assistant' || m.type === 'assistant')
  for (let i = assistantMessages.length - 1; i >= 0; i--) {
    const content = assistantMessages[i].content || assistantMessages[i].message || ''
    const text = typeof content === 'string' ? content : JSON.stringify(content)
    const jsonMatch = text.match(/\{[\s\S]*"confidence"[\s\S]*"plan"[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {
        continue
      }
    }
  }
  return null
}
