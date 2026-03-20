"use client"

import { useEffect, useRef, useCallback } from "react"

const ASCII_CHARS = " .:-=+*#%@"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
}

export default function AsciiCampfire() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const asciiRef = useRef<HTMLPreElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const timeRef = useRef(0)
  const animationRef = useRef<number>(0)

  const createParticle = useCallback((baseX: number, baseY: number): Particle => {
    return {
      x: baseX + (Math.random() - 0.5) * 60,
      y: baseY,
      vx: (Math.random() - 0.5) * 1,
      vy: -Math.random() * 1.5 - 0.8,
      life: 1,
      maxLife: Math.random() * 120 + 80,
      size: Math.random() * 5 + 3,
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ascii = asciiRef.current
    if (!canvas || !ascii) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const width = 440
    const height = 280
    canvas.width = width
    canvas.height = height

    const cellSize = 4
    const cols = Math.floor(width / cellSize)
    const rows = Math.floor(height / cellSize)

    const animate = () => {
      timeRef.current += 0.018
      const time = timeRef.current

      // Clear canvas
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)

      const centerX = width / 2 - 40
      const baseY = height - 50

      // Draw logs with 3D perspective
      const logColors = ["#4a3728", "#5c4333", "#3d2b1f", "#6b4423"]
      const logs = [
        { x: centerX - 70, y: baseY + 5, w: 140, h: 14, angle: 0.12 },
        { x: centerX - 60, y: baseY + 18, w: 125, h: 12, angle: -0.08 },
        { x: centerX - 50, y: baseY - 2, w: 105, h: 12, angle: 0.15 },
      ]

      logs.forEach((log, i) => {
        ctx.save()
        ctx.translate(log.x + log.w / 2, log.y + log.h / 2)
        ctx.rotate(log.angle + Math.sin(time * 0.3 + i) * 0.01)
        ctx.fillStyle = logColors[i % logColors.length]
        ctx.fillRect(-log.w / 2, -log.h / 2, log.w, log.h)
        // Pixel detail on logs
        ctx.fillStyle = "#2d1f14"
        for (let j = 0; j < 6; j++) {
          ctx.fillRect(-log.w / 2 + 12 + j * 20, -log.h / 2 + 3, 5, 5)
        }
        ctx.restore()
      })

      // Draw stone ring around fire - darker and further out
      const stoneColors = ["#2d3748", "#1a202c", "#252d3d", "#1f2937", "#374151"]
      const stoneCount = 14
      const ringRadius = 95
      for (let i = 0; i < stoneCount; i++) {
        const angle = (i / stoneCount) * Math.PI * 2 - Math.PI / 2
        const stoneX = centerX + Math.cos(angle) * ringRadius
        const stoneY = baseY + 18 + Math.sin(angle) * 25
        const stoneW = 20 + Math.sin(i * 2.5) * 5
        const stoneH = 15 + Math.cos(i * 1.8) * 4

        ctx.fillStyle = stoneColors[i % stoneColors.length]
        ctx.beginPath()
        ctx.ellipse(stoneX, stoneY, stoneW / 2, stoneH / 2, 0, 0, Math.PI * 2)
        ctx.fill()

        // Subtle highlight
        ctx.fillStyle = "#4a5568"
        ctx.beginPath()
        ctx.ellipse(stoneX - 2, stoneY - 2, stoneW / 6, stoneH / 6, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw fire using individual pixel-like wisps
      // Each wisp is a narrow, tapered flame tongue
      const drawWisp = (
        x: number,
        baseHeight: number,
        width: number,
        phase: number,
        colorSet: string[]
      ) => {
        const t = time + phase
        const sway = Math.sin(t * 1.8) * 8 + Math.sin(t * 2.7) * 4
        const heightMod = Math.sin(t * 2.2) * 15 + Math.sin(t * 3.1) * 8
        const h = baseHeight + heightMod

        // Draw from bottom to top as stacked rectangles that taper
        const segments = Math.floor(h / 4)
        for (let i = 0; i < segments; i++) {
          const progress = i / segments // 0 at base, 1 at tip
          const segY = baseY - 8 - i * 4

          // Width tapers sharply toward tip (exponential falloff)
          const taper = Math.pow(1 - progress, 0.6)
          const segWidth = Math.max(4, width * taper)

          // Sway increases toward tip
          const segSway = sway * progress * progress
          const wobble = Math.sin(t * 4 + i * 0.5) * 2 * progress

          // Color based on height - white/yellow at base, orange, then red at tips
          let colorIdx: number
          if (progress < 0.2) {
            colorIdx = 0 // white/yellow core
          } else if (progress < 0.45) {
            colorIdx = 1 // bright yellow
          } else if (progress < 0.7) {
            colorIdx = 2 // orange
          } else {
            colorIdx = 3 // red tip
          }

          ctx.fillStyle = colorSet[colorIdx]
          const px = Math.round((x + segSway + wobble) / 4) * 4
          const py = Math.round(segY / 4) * 4
          const pw = Math.round(segWidth / 4) * 4

          ctx.fillRect(px - pw / 2, py, pw, 4)
        }
      }

      // Color sets for flames (core to tip)
      const mainColors = ["#fffef0", "#ffdd44", "#ff8800", "#cc2200"]
      const hotColors = ["#ffffff", "#ffffaa", "#ffaa22", "#dd4400"]
      const coolColors = ["#fff8e0", "#ffcc00", "#ff6600", "#aa1100"]

      // Main central wisps - tallest
      drawWisp(centerX, 100, 18, 0, hotColors)
      drawWisp(centerX - 6, 90, 14, 0.5, mainColors)
      drawWisp(centerX + 8, 95, 16, 0.3, mainColors)

      // Secondary wisps
      drawWisp(centerX - 18, 75, 12, 1.2, mainColors)
      drawWisp(centerX + 20, 70, 12, 0.8, coolColors)
      drawWisp(centerX - 10, 85, 14, 1.8, hotColors)
      drawWisp(centerX + 14, 80, 13, 2.1, mainColors)

      // Outer smaller wisps
      drawWisp(centerX - 30, 50, 10, 2.5, coolColors)
      drawWisp(centerX + 32, 45, 9, 1.5, coolColors)
      drawWisp(centerX - 24, 55, 10, 3.2, mainColors)
      drawWisp(centerX + 26, 52, 10, 2.8, mainColors)

      // Tiny accent wisps
      drawWisp(centerX - 38, 30, 6, 4.0, coolColors)
      drawWisp(centerX + 40, 28, 6, 3.5, coolColors)
      drawWisp(centerX - 4, 70, 8, 4.5, hotColors)
      drawWisp(centerX + 4, 65, 8, 5.0, hotColors)

      // Add subtle glowing core at base only
      const gradient = ctx.createRadialGradient(centerX, baseY - 15, 5, centerX, baseY - 15, 40)
      gradient.addColorStop(0, "rgba(255, 255, 200, 0.5)")
      gradient.addColorStop(0.4, "rgba(255, 200, 50, 0.25)")
      gradient.addColorStop(1, "rgba(255, 100, 0, 0)")
      ctx.fillStyle = gradient
      ctx.fillRect(centerX - 50, baseY - 40, 100, 35)

      // Draw Smiski character - simple, solid shapes with dark colors for ASCII visibility
      const smiskiX = centerX + 140
      const smiskiY = baseY - 5
      const breathe = Math.sin(time * 1.2) * 2

      // Use darker, more saturated colors that create contrast
      const smiskiBody = "#2d8a4e"       // medium-dark green
      const smiskiOutline = "#1a5c32"    // dark green outline
      const smiskiHighlight = "#4ade80"  // highlight
      const smiskiFace = "#0d3320"       // very dark for eyes/mouth

      // Draw as solid filled shapes for clean ASCII rendering
      
      // BODY - simple sitting blob shape
      ctx.fillStyle = smiskiBody
      ctx.beginPath()
      ctx.moveTo(smiskiX - 20, smiskiY + 30)
      ctx.quadraticCurveTo(smiskiX - 25, smiskiY + 10, smiskiX - 15, smiskiY)
      ctx.quadraticCurveTo(smiskiX, smiskiY - 5, smiskiX + 15, smiskiY)
      ctx.quadraticCurveTo(smiskiX + 25, smiskiY + 10, smiskiX + 20, smiskiY + 30)
      ctx.closePath()
      ctx.fill()

      // LEFT LEG (toward fire)
      ctx.fillStyle = smiskiBody
      ctx.beginPath()
      ctx.ellipse(smiskiX - 22, smiskiY + 32, 14, 8, -0.3, 0, Math.PI * 2)
      ctx.fill()

      // RIGHT LEG
      ctx.beginPath()
      ctx.ellipse(smiskiX + 12, smiskiY + 34, 12, 7, 0.2, 0, Math.PI * 2)
      ctx.fill()

      // HEAD - large round, signature Smiski proportions
      const headCenterX = smiskiX - 3
      const headCenterY = smiskiY - 35 + breathe
      const headRadius = 32

      ctx.fillStyle = smiskiBody
      ctx.beginPath()
      ctx.arc(headCenterX, headCenterY, headRadius, 0, Math.PI * 2)
      ctx.fill()

      // Head outline for definition
      ctx.strokeStyle = smiskiOutline
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(headCenterX, headCenterY, headRadius, 0, Math.PI * 2)
      ctx.stroke()

      // LEFT ARM reaching toward fire
      ctx.fillStyle = smiskiBody
      ctx.beginPath()
      ctx.moveTo(smiskiX - 18, smiskiY + 5)
      ctx.quadraticCurveTo(smiskiX - 40, smiskiY - 5, smiskiX - 55, smiskiY - 15 + breathe * 0.5)
      ctx.quadraticCurveTo(smiskiX - 58, smiskiY - 10, smiskiX - 55, smiskiY - 5 + breathe * 0.5)
      ctx.quadraticCurveTo(smiskiX - 38, smiskiY + 5, smiskiX - 18, smiskiY + 12)
      ctx.closePath()
      ctx.fill()

      // LEFT HAND (palm facing fire - warm tint)
      ctx.fillStyle = "#c4956a"  // warm skin tone from fire glow
      ctx.beginPath()
      ctx.ellipse(smiskiX - 58, smiskiY - 10 + breathe * 0.5, 7, 9, 0.2, 0, Math.PI * 2)
      ctx.fill()

      // RIGHT ARM (lower, also toward fire)  
      ctx.fillStyle = smiskiBody
      ctx.beginPath()
      ctx.moveTo(smiskiX - 12, smiskiY + 15)
      ctx.quadraticCurveTo(smiskiX - 30, smiskiY + 10, smiskiX - 48, smiskiY + 5 + breathe * 0.3)
      ctx.quadraticCurveTo(smiskiX - 50, smiskiY + 12, smiskiX - 46, smiskiY + 15 + breathe * 0.3)
      ctx.quadraticCurveTo(smiskiX - 28, smiskiY + 18, smiskiX - 12, smiskiY + 22)
      ctx.closePath()
      ctx.fill()

      // RIGHT HAND
      ctx.fillStyle = "#c4956a"
      ctx.beginPath()
      ctx.ellipse(smiskiX - 50, smiskiY + 10 + breathe * 0.3, 6, 8, -0.1, 0, Math.PI * 2)
      ctx.fill()

      // EYES - two solid dots, looking toward fire (positioned left)
      ctx.fillStyle = smiskiFace
      // Left eye
      ctx.beginPath()
      ctx.arc(headCenterX - 12, headCenterY - 2 + breathe, 5, 0, Math.PI * 2)
      ctx.fill()
      // Right eye
      ctx.beginPath()
      ctx.arc(headCenterX + 6, headCenterY - 2 + breathe, 5, 0, Math.PI * 2)
      ctx.fill()

      // MOUTH - small oval, slightly open (Smiski expression)
      ctx.beginPath()
      ctx.ellipse(headCenterX - 4, headCenterY + 12 + breathe, 5, 4, 0, 0, Math.PI * 2)
      ctx.fill()

      // Manage particles (sparks/embers)
      if (Math.random() < 0.15) {
        particlesRef.current.push(createParticle(centerX, baseY - 55))
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx + Math.sin(time * 1.2 + p.y * 0.08) * 0.3
        p.y += p.vy
        p.vy += 0.008 // slight gravity resistance
        p.life -= 1 / p.maxLife

        if (p.life > 0) {
          const alpha = p.life
          const colorVal = Math.floor(255 * p.life)
          ctx.fillStyle = `rgba(255, ${colorVal}, 0, ${alpha})`
          const size = Math.round(p.size * p.life / 2) * 2
          ctx.fillRect(Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2, size, size)
          return true
        }
        return false
      })

      // Convert canvas to ASCII
      const imageData = ctx.getImageData(0, 0, width, height)
      const pixels = imageData.data
      let asciiStr = ""

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * cellSize
          const py = y * cellSize

          let r = 0, g = 0, b = 0
          let count = 0

          // Sample pixels in cell
          for (let cy = 0; cy < cellSize; cy++) {
            for (let cx = 0; cx < cellSize; cx++) {
              const i = ((py + cy) * width + (px + cx)) * 4
              r += pixels[i]
              g += pixels[i + 1]
              b += pixels[i + 2]
              count++
            }
          }

          r /= count
          g /= count
          b /= count

          // Calculate brightness and fire intensity
          const brightness = (r + g + b) / 3
          const fireIntensity = (r - b) / 255

          // Detect if this is a green (Smiski) pixel
          const isGreen = g > r * 1.1 && g > b * 1.1 && g > 60
          const isWarmHand = r > 150 && g > 100 && g < 180 && b < 130

          // Determine ASCII character
          let charIndex: number
          if (brightness > 250 && fireIntensity < 0.1 && !isGreen) {
            // Background (white)
            charIndex = 0
          } else if (isGreen || isWarmHand) {
            // Smiski - use inverse brightness for solid look
            const greenIntensity = 1 - (brightness / 255) * 0.7
            charIndex = Math.floor(Math.min(1, Math.max(0.3, greenIntensity)) * (ASCII_CHARS.length - 1))
          } else {
            // Fire/object pixels
            const intensity = 1 - brightness / 255 + fireIntensity * 0.5
            charIndex = Math.floor(Math.min(1, Math.max(0, intensity)) * (ASCII_CHARS.length - 1))
          }

          // Add color based on content
          let color = "#1a1a1a"
          if (isGreen) {
            // Smiski green shades
            if (brightness > 160) {
              color = "#4ade80"
            } else if (brightness > 100) {
              color = "#22c55e"
            } else if (brightness > 50) {
              color = "#16a34a"
            } else {
              color = "#166534" // eyes/mouth
            }
          } else if (isWarmHand) {
            // Warm hands from fire glow
            color = "#d4a574"
          } else if (fireIntensity > 0.3) {
            if (brightness > 220) {
              color = "#fff4e0"
            } else if (brightness > 180) {
              color = "#ffcc00"
            } else if (brightness > 120) {
              color = "#ff6600"
            } else {
              color = "#cc3300"
            }
          } else if (r < 100 && g < 80 && b < 60) {
            // Brown logs
            color = "#4a3728"
          } else if (r < 80 && g < 80 && b < 100 && Math.abs(r - g) < 25) {
            // Dark stones
            color = "#374151"
          }

          asciiStr += `<span style="color:${color}">${ASCII_CHARS[charIndex]}</span>`
        }
        asciiStr += "\n"
      }

      ascii.innerHTML = asciiStr

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [createParticle])

  return (
    <main className="min-h-screen bg-white flex items-center justify-center overflow-hidden">
      <div className="relative">
        {/* Hidden canvas for rendering */}
        <canvas ref={canvasRef} className="absolute opacity-0 pointer-events-none" />

        {/* ASCII output */}
        <pre
          ref={asciiRef}
          className="font-mono text-[10px] leading-[10px] tracking-[1px] select-none"
          style={{
            fontFamily: "monospace",
            whiteSpace: "pre",
            textShadow: "0 0 15px rgba(255, 120, 40, 0.4)",
          }}
        />

        {/* Ambient glow effect */}
        <div
          className="absolute inset-0 pointer-events-none rounded-full blur-3xl opacity-30"
          style={{
            background: "radial-gradient(circle at 50% 70%, rgba(255, 150, 50, 0.4), transparent 60%)",
          }}
        />
      </div>
    </main>
  )
}
