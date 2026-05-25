import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Landing } from "./pages/landing"
import { Mic } from "./pages/mic"
import "./landing.css"

document.getElementById("static-fallback")?.remove()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/mic" element={<Mic />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
