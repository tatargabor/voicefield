"use client"

import dynamic from "next/dynamic"

const Mic = dynamic(() => import("@voicefield/react/phone").then((m) => ({ default: m.Mic })), {
  ssr: false,
})

export default function MicPage() {
  return <Mic />
}
