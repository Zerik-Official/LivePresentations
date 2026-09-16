from __future__ import annotations
import json
import uuid

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Register / login
email = "demo@livepresentations.com"
password = "password123"
r = client.post("/api/auth/register", json={"email": email, "password": password})
if r.status_code == 409:
    r = client.post("/api/auth/login", json={"email": email, "password": password})
print("auth", r.status_code, r.json()["user"]["email"])
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Create presentation
r = client.post("/api/presentations", json={"title": "Client Components - Next.js", "data": {"slides": [], "width": 1280, "height": 720}}, headers=headers)
pid = r.json()["id"]
print("pid", pid)

def eid(): return f"el-{uuid.uuid4().hex[:8]}"
def sid(): return f"slide-{uuid.uuid4().hex[:8]}"

slides = []

# Slide 1: Title
slides.append({
    "id": sid(),
    "background": "#0f172a",
    "transition": "fade",
    "elements": [
        {"id": eid(), "type": "text", "x": 80, "y": 140, "w": 1120, "h": 90, "rotation": 0, "zIndex": 1, "props": {"text": "Client Components", "fontSize": 64, "color": "#f8fafc", "align": "center", "bold": True}, "highlightable": True},
        {"id": eid(), "type": "text", "x": 80, "y": 250, "w": 1120, "h": 50, "rotation": 0, "zIndex": 2, "props": {"text": "en Next.js 14+ — App Router", "fontSize": 28, "color": "#94a3b8", "align": "center", "bold": False}, "highlightable": False},
        {"id": eid(), "type": "text", "x": 320, "y": 340, "w": 640, "h": 40, "rotation": 0, "zIndex": 3, "props": {"text": "Cuándo, cómo y por qué usar 'use client'", "fontSize": 20, "color": "#38bdf8", "align": "center", "bold": False}, "highlightable": False},
        {"id": eid(), "type": "icon", "x": 600, "y": 420, "w": 80, "h": 80, "rotation": 0, "zIndex": 4, "props": {"name": "FaReact", "color": "#61dafb", "size": 64, "bg": "transparent"}, "highlightable": False},
    ]
})

# Slide 2: Qué son
slides.append({
    "id": sid(),
    "background": "#ffffff",
    "transition": "slide",
    "elements": [
        {"id": eid(), "type": "text", "x": 60, "y": 40, "w": 600, "h": 50, "rotation": 0, "zIndex": 1, "props": {"text": "¿Qué son?", "fontSize": 40, "color": "#0f172a", "align": "left", "bold": True}, "highlightable": True},
        {"id": eid(), "type": "text", "x": 60, "y": 110, "w": 580, "h": 160, "rotation": 0, "zIndex": 2, "props": {"text": "• Se renderizan en el cliente (navegador).\n• Pueden usar estado, efectos y eventos.\n• Requieren directiva 'use client' al inicio del archivo.\n• El resto son Server Components por defecto.", "fontSize": 18, "color": "#334155", "align": "left", "bold": False}, "highlightable": False},
        {"id": eid(), "type": "code", "x": 680, "y": 60, "w": 540, "h": 220, "rotation": 0, "zIndex": 3, "props": {"code": "\"'use client'\\n\\nimport { useState } from 'react'\\n\\nexport default function Counter() {\\n  const [n, setN] = useState(0)\\n  return <button onClick={() => setN(n+1)}>{n}</button>\\n}\"", "language": "javascript"}, "highlightable": True},
        {"id": eid(), "type": "shape", "x": 60, "y": 320, "w": 1160, "h": 70, "rotation": 0, "zIndex": 4, "props": {"variant": "rect", "fill": "#f1f5f9", "radius": 12, "borderWidth": 1, "borderColor": "#e2e8f0"}, "highlightable": False},
        {"id": eid(), "type": "text", "x": 80, "y": 335, "w": 1120, "h": 40, "rotation": 0, "zIndex": 5, "props": {"text": "Sin 'use client' → no puedes usar useState, useEffect, onClick...", "fontSize": 16, "color": "#64748b", "align": "left", "bold": False}, "highlightable": False},
    ]
})
# Fix slide 2 code properly (escape handling)
slides[1]["elements"][2]["props"]["code"] = "'use client'\n\nimport { useState } from 'react'\n\nexport default function Counter() {\n  const [n, setN] = useState(0)\n  return <button onClick={() => setN(n+1)}>{n}</button>\n}"

# Slide 3: Server vs Client comparison
slides.append({
    "id": sid(),
    "background": "#ffffff",
    "transition": "slide",
    "elements": [
        {"id": eid(), "type": "text", "x": 60, "y": 40, "w": 1160, "h": 50, "rotation": 0, "zIndex": 1, "props": {"text": "Server vs Client", "fontSize": 40, "color": "#0f172a", "align": "left", "bold": True}, "highlightable": True},
        {"id": eid(), "type": "shape", "x": 60, "y": 110, "w": 540, "h": 200, "rotation": 0, "zIndex": 2, "props": {"variant": "rect", "fill": "#ecfdf5", "radius": 16, "borderWidth": 1, "borderColor": "#6ee7b7"}, "highlightable": False},
        {"id": eid(), "type": "text", "x": 80, "y": 125, "w": 500, "h": 170, "rotation": 0, "zIndex": 3, "props": {"text": "Server Components\n• Fetch directo a DB/API\n• Cero JS al cliente\n• SEO óptimo\n• No usan estado", "fontSize": 16, "color": "#065f46", "align": "left", "bold": False}, "highlightable": False},
        {"id": eid(), "type": "shape", "x": 680, "y": 110, "w": 540, "h": 200, "rotation": 0, "zIndex": 4, "props": {"variant": "rect", "fill": "#eff6ff", "radius": 16, "borderWidth": 1, "borderColor": "#93c5fd"}, "highlightable": False},
        {"id": eid(), "type": "text", "x": 700, "y": 125, "w": 500, "h": 170, "rotation": 0, "zIndex": 5, "props": {"text": "Client Components\n• Interactividad\n• useState / useEffect\n• Listeners (onClick)\n• Envia JS al cliente", "fontSize": 16, "color": "#1e40af", "align": "left", "bold": False}, "highlightable": False},
        {"id": eid(), "type": "text", "x": 60, "y": 340, "w": 1160, "h": 30, "rotation": 0, "zIndex": 6, "props": {"text": "Regla: empieza Server, convierte a Client solo si necesitas interactividad.", "fontSize": 16, "color": "#475569", "align": "center", "bold": False}, "highlightable": False},
    ]
})

# Slide 4: use client example
slides.append({
    "id": sid(),
    "background": "#ffffff",
    "transition": "zoom",
    "elements": [
        {"id": eid(), "type": "text", "x": 60, "y": 40, "w": 1160, "h": 50, "rotation": 0, "zIndex": 1, "props": {"text": "Directiva 'use client'", "fontSize": 36, "color": "#0f172a", "align": "left", "bold": True}, "highlightable": True},
        {"id": eid(), "type": "code", "x": 60, "y": 110, "w": 560, "h": 260, "rotation": 0, "zIndex": 2, "props": {"language": "javascript", "code": "'use client'\n\nimport { useState } from 'react'\n\nexport default function LikeButton() {\n  const [liked, setLiked] = useState(false)\n  return (\n    <button onClick={() => setLiked(!liked)}>\n      {liked ? '❤️ Liked' : '🤍 Like'}\n    </button>\n  )\n}"}, "highlightable": True},
        {"id": eid(), "type": "text", "x": 660, "y": 110, "w": 560, "h": 260, "rotation": 0, "zIndex": 3, "props": {"text": "• Va SIEMPRE en la 1ª línea.\n• Convierte el archivo y sus imports en Client.\n• No la pongas en layout.tsx global.\n• Úsala en hojas (leaves), no en ramas altas.", "fontSize": 16, "color": "#334155", "align": "left", "bold": False}, "highlightable": False},
    ]
})

# Slide 5: ADVERTENCIA Context API
slides.append({
    "id": sid(),
    "background": "#fef2f2",
    "transition": "slide",
    "elements": [
        {"id": eid(), "type": "shape", "x": 60, "y": 40, "w": 1160, "h": 90, "rotation": 0, "zIndex": 1, "props": {"variant": "rect", "fill": "#fee2e2", "radius": 14, "borderWidth": 2, "borderColor": "#fca5a5"}, "highlightable": False},
        {"id": eid(), "type": "icon", "x": 80, "y": 55, "w": 60, "h": 60, "rotation": 0, "zIndex": 2, "props": {"name": "FaExclamationTriangle", "color": "#dc2626", "size": 36, "bg": "transparent"}, "highlightable": False},
        {"id": eid(), "type": "text", "x": 150, "y": 55, "w": 1040, "h": 60, "rotation": 0, "zIndex": 3, "props": {"text": "ADVERTENCIA: Context API solo envuelve Client Components", "fontSize": 22, "color": "#991b1b", "align": "left", "bold": True}, "highlightable": True},
        {"id": eid(), "type": "text", "x": 60, "y": 145, "w": 1160, "h": 35, "rotation": 0, "zIndex": 4, "props": {"text": "No envuelvas todo el layout. El Provider debe estar en un Client Component hoja.", "fontSize": 16, "color": "#7f1d1d", "align": "center", "bold": False}, "highlightable": False},
        {"id": eid(), "type": "code", "x": 60, "y": 190, "w": 550, "h": 210, "rotation": 0, "zIndex": 5, "props": {"language": "javascript", "code": "// ❌ MAL — layout.tsx es Server\n// No puedes poner 'use client' aquí para todo\nexport default function RootLayout({ children }) {\n  return (\n    <ThemeContext.Provider value={theme}>\n      <html><body>{children}</body></html>\n    </ThemeContext.Provider>\n  )\n}"}, "highlightable": True},
        {"id": eid(), "type": "code", "x": 670, "y": 190, "w": 550, "h": 240, "rotation": 0, "zIndex": 6, "props": {"language": "javascript", "code": "// ✅ BIEN — Providers.tsx es Client\n'use client'\nimport { createContext } from 'react'\nexport const ThemeContext = createContext(null)\n\nexport function Providers({ children }) {\n  const [theme, setTheme] = useState('light')\n  return (\n    <ThemeContext.Provider value={{ theme, setTheme }}>\n      {children}\n    </ThemeContext.Provider>\n  )\n}"}, "highlightable": True},
        {"id": eid(), "type": "text", "x": 60, "y": 445, "w": 1160, "h": 30, "rotation": 0, "zIndex": 7, "props": {"text": "layout.tsx (Server) → importa <Providers> (Client) → envuelve solo donde se necesita contexto.", "fontSize": 13, "color": "#991b1b", "align": "center", "bold": False}, "highlightable": False},
    ]
})

# Slide 6: Ejemplo práctico completo
slides.append({
    "id": sid(),
    "background": "#ffffff",
    "transition": "fade",
    "elements": [
        {"id": eid(), "type": "text", "x": 60, "y": 30, "w": 1160, "h": 50, "rotation": 0, "zIndex": 1, "props": {"text": "Ejemplo práctico", "fontSize": 36, "color": "#0f172a", "align": "left", "bold": True}, "highlightable": True},
        {"id": eid(), "type": "code", "x": 60, "y": 90, "w": 560, "h": 300, "rotation": 0, "zIndex": 2, "props": {"language": "javascript", "code": "// app/providers.tsx\n'use client'\nimport { createContext, useState } from 'react'\n\nexport const CartContext = createContext(null)\n\nexport function CartProvider({ children }) {\n  const [items, setItems] = useState([])\n  return (\n    <CartContext.Provider value={{ items, setItems }}>\n      {children}\n    </CartContext.Provider>\n  )\n}"}, "highlightable": True},
        {"id": eid(), "type": "code", "x": 660, "y": 90, "w": 560, "h": 300, "rotation": 0, "zIndex": 3, "props": {"language": "javascript", "code": "// app/layout.tsx (Server)\nimport { CartProvider } from './providers'\nimport Header from './header' // Server\n\nexport default function Layout({ children }) {\n  return (\n    <html><body>\n      <CartProvider>\n        <Header />\n        {children}\n      </CartProvider>\n    </body></html>\n  )\n}\n\n// components/AddToCart.tsx ('use client')\n'use client'\nimport { useContext } from 'react'\nimport { CartContext } from '@/app/providers'\n\nexport function AddToCart({ product }) {\n  const { setItems } = useContext(CartContext)\n  return <button onClick={() => setItems(...) }>Add</button>\n}"}, "highlightable": True},
        {"id": eid(), "type": "text", "x": 60, "y": 410, "w": 1160, "h": 30, "rotation": 0, "zIndex": 4, "props": {"text": "Solo AddToCart y CartProvider son Client. Header y Layout siguen siendo Server.", "fontSize": 14, "color": "#475569", "align": "center", "bold": False}, "highlightable": False},
    ]
})

# Slide 7: Resumen
slides.append({
    "id": sid(),
    "background": "#0f172a",
    "transition": "zoom",
    "elements": [
        {"id": eid(), "type": "text", "x": 60, "y": 50, "w": 1160, "h": 50, "rotation": 0, "zIndex": 1, "props": {"text": "Resumen", "fontSize": 40, "color": "#f8fafc", "align": "left", "bold": True}, "highlightable": True},
        {"id": eid(), "type": "text", "x": 60, "y": 120, "w": 560, "h": 250, "rotation": 0, "zIndex": 2, "props": {"text": "✓ Server por defecto\n✓ 'use client' solo si necesitas:\n  - estado / efecto / contexto\n  - eventos / browser API\n✓ Empuja Client a las hojas\n✓ Context Provider = Client, no Layout", "fontSize": 18, "color": "#cbd5e1", "align": "left", "bold": False}, "highlightable": False},
        {"id": eid(), "type": "shape", "x": 680, "y": 120, "w": 540, "h": 250, "rotation": 0, "zIndex": 3, "props": {"variant": "rect", "fill": "#1e293b", "radius": 16, "borderWidth": 1, "borderColor": "#334155"}, "highlightable": False},
        {"id": eid(), "type": "text", "x": 700, "y": 140, "w": 500, "h": 220, "rotation": 0, "zIndex": 4, "props": {"text": "Menos JS = más rápido\n\n• Server: 0 KB JS\n• Client: paga costo\n\nMide con:\nnext/bundle-analyzer\nReact DevTools", "fontSize": 16, "color": "#94a3b8", "align": "left", "bold": False}, "highlightable": False},
        {"id": eid(), "type": "text", "x": 60, "y": 400, "w": 1160, "h": 30, "rotation": 0, "zIndex": 5, "props": {"text": "Dudas? → Probemos en vivo con LivePresentations", "fontSize": 16, "color": "#38bdf8", "align": "center", "bold": False}, "highlightable": False},
    ]
})

data = {"slides": slides, "width": 1280, "height": 720, "theme": {"primary": "#0f172a", "accent": "#38bdf8"}}

r = client.put(f"/api/presentations/{pid}", json={"data": data}, headers=headers)
print("update", r.status_code)
if r.status_code != 200:
    print(r.text)
else:
    print("presentation updated with", len(slides), "slides")

# Verify
r = client.get(f"/api/presentations/{pid}", headers=headers)
print("get", r.json()["title"], "slides", len(r.json()["data"]["slides"]))

# Create room
r = client.post("/api/rooms", json={"presentation_id": pid}, headers=headers)
print("room", r.json())
code = r.json()["code"]
print(f"Presentación lista: pid={pid} code={code}")
print(f"Editor: /editor/{pid}")
print(f"Presentar: /present/{code}")
print(f"Control: /control/{code}")
