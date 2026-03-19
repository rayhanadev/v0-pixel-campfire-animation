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

    const width = 360
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

      const centerX = width / 2
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

      // Draw stone ring around fire
      const stoneColors = ["#6b7280", "#4b5563", "#374151", "#52525b", "#71717a"]
      const stoneCount = 12
      const ringRadius = 75
      for (let i = 0; i < stoneCount; i++) {
        const angle = (i / stoneCount) * Math.PI * 2 - Math.PI / 2
        const stoneX = centerX + Math.cos(angle) * ringRadius
        const stoneY = baseY + 15 + Math.sin(angle) * 20 // ellipse for perspective
        const stoneW = 18 + Math.sin(i * 2.5) * 4
        const stoneH = 14 + Math.cos(i * 1.8) * 3

        // Stone body
        ctx.fillStyle = stoneColors[i % stoneColors.length]
        ctx.beginPath()
        ctx.ellipse(stoneX, stoneY, stoneW / 2, stoneH / 2, 0, 0, Math.PI * 2)
        ctx.fill()

        // Stone highlight
        ctx.fillStyle = "#9ca3af"
        ctx.beginPath()
        ctx.ellipse(stoneX - 3, stoneY - 3, stoneW / 5, stoneH / 5, 0, 0, Math.PI * 2)
        ctx.fill()

        // Stone shadow
        ctx.fillStyle = "#1f2937"
        ctx.beginPath()
        ctx.ellipse(stoneX + 2, stoneY + 3, stoneW / 4, stoneH / 6, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw distinct flame tongues
      const flames = [
        { offsetX: 0, height: 130, width: 35, speed: 1.0 },      // center main
        { offsetX: -25, height: 100, width: 28, speed: 1.2 },    // left
        { offsetX: 25, height: 95, width: 26, speed: 0.9 },      // right
        { offsetX: -12, height: 115, width: 30, speed: 1.1 },    // left-center
        { offsetX: 15, height: 110, width: 28, speed: 1.3 },     // right-center
        { offsetX: -35, height: 70, width: 22, speed: 0.8 },     // far left
        { offsetX: 38, height: 65, width: 20, speed: 1.0 },      // far right
      ]

      flames.forEach((flame, idx) => {
        const flameTime = time * flame.speed
        const swayX = Math.sin(flameTime * 1.5 + idx) * 6
        const flickerH = Math.sin(flameTime * 2 + idx * 0.7) * 15

        const fx = centerX + flame.offsetX + swayX
        const fy = baseY - 5
        const fh = flame.height + flickerH
        const fw = flame.width + Math.sin(flameTime + idx) * 4

        // Draw 3 layers per flame tongue (outer red, mid orange, inner yellow/white)
        const layers = [
          { scale: 1.0, color: `rgba(200, 50, 20, 0.9)` },
          { scale: 0.7, color: `rgba(255, 120, 0, 0.95)` },
          { scale: 0.45, color: `rgba(255, 200, 50, 0.95)` },
          { scale: 0.25, color: `rgba(255, 255, 200, 0.9)` },
        ]

        layers.forEach((layer) => {
          const lw = fw * layer.scale
          const lh = fh * layer.scale

          ctx.fillStyle = layer.color
          ctx.beginPath()
          ctx.moveTo(fx - lw / 2, fy)

          // Left edge going up
          const steps = 6
          for (let i = 0; i <= steps; i++) {
            const t = i / steps
            const edgeWobble = Math.sin(flameTime * 3 + t * 4 + idx) * 3 * layer.scale
            const x = fx - lw / 2 + edgeWobble + (lw * 0.1 * t)
            const y = fy - lh * t
            const px = Math.round(x / 4) * 4
            const py = Math.round(y / 4) * 4
            ctx.lineTo(px, py)
          }

          // Tip with flicker
          const tipWobble = Math.sin(flameTime * 4 + idx * 2) * 4
          ctx.lineTo(Math.round((fx + tipWobble) / 4) * 4, Math.round((fy - lh - 8) / 4) * 4)

          // Right edge going down
          for (let i = steps; i >= 0; i--) {
            const t = i / steps
            const edgeWobble = Math.sin(flameTime * 3 + t * 4 + idx + 2) * 3 * layer.scale
            const x = fx + lw / 2 + edgeWobble - (lw * 0.1 * t)
            const y = fy - lh * t
            const px = Math.round(x / 4) * 4
            const py = Math.round(y / 4) * 4
            ctx.lineTo(px, py)
          }

          ctx.closePath()
          ctx.fill()
        })
      })

      // Add glowing core
      const gradient = ctx.createRadialGradient(centerX, baseY - 35, 8, centerX, baseY - 35, 60)
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.85)")
      gradient.addColorStop(0.25, "rgba(255, 255, 150, 0.65)")
      gradient.addColorStop(0.5, "rgba(255, 200, 50, 0.35)")
      gradient.addColorStop(1, "rgba(255, 100, 0, 0)")
      ctx.fillStyle = gradient
      ctx.fillRect(centerX - 70, baseY - 80, 140, 70)

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

          // Determine ASCII character
          let charIndex: number
          if (brightness > 250 && fireIntensity < 0.1) {
            // Background (white)
            charIndex = 0
          } else {
            // Fire/object pixels - invert for ASCII (darker = denser char)
            const intensity = 1 - brightness / 255 + fireIntensity * 0.5
            charIndex = Math.floor(Math.min(1, Math.max(0, intensity)) * (ASCII_CHARS.length - 1))
          }

          // Add color based on fire
          let color = "#1a1a1a"
          if (fireIntensity > 0.3) {
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
          } else if (r > 60 && r < 130 && g > 60 && g < 130 && b > 60 && b < 130 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) {
            // Gray stones
            color = "#6b7280"
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
