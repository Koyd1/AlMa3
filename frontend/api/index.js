import { withCors } from './_lib/cors.js'

export default withCors(function handler(req, res) {
  res.status(200).json({
    name: "AI Agents API (Vercel)",
    status: "ok",
    endpoints: [
      { method: "GET", path: "/api", description: "API index" },
      { method: "GET", path: "/api/health", description: "Service health" },
      { method: "GET", path: "/api/agents", description: "List agents" },
      { method: "GET", path: "/api/runs", description: "List runs" },
      { method: "GET", path: "/api/billing/balance", description: "Get balance" }
    ]
  })
})
