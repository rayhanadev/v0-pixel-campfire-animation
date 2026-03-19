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

      // Create flame layers with 3D depth
      const flameCount = 9
      for (let layer = 0; layer < flameCount; layer++) {
        const depthScale = 1 - layer * 0.06
        const flameHeight = (110 + Math.sin(time * 1.2 + layer) * 12) * depthScale
        const flameWidth = (80 + Math.sin(time * 0.9 + layer * 0.5) * 15) * depthScale

        // Flame color gradient based on layer (inner = brighter)
        let color: string
        if (layer < 2) {
          color = `rgba(255, 255, 230, ${0.9 - layer * 0.1})`
        } else if (layer < 5) {
          color = `rgba(255, ${210 - layer * 18}, 0, ${0.85 - layer * 0.04})`
        } else {
          color = `rgba(255, ${120 - layer * 8}, 0, ${0.7 - layer * 0.04})`
        }

        const offsetX = Math.sin(time * 1.5 + layer * 1.8) * (4 + layer * 3)
        const offsetY = Math.cos(time * 1.2 + layer) * 3

        // Draw pixelated flame shape
        ctx.fillStyle = color
        const flameX = centerX + offsetX - flameWidth / 2 + (layer - 4) * 8
        const flameY = baseY - 10 + offsetY

        // Create jagged flame top
        ctx.beginPath()
        ctx.moveTo(flameX, flameY)

        const segments = 12
        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const x = flameX + t * flameWidth
          const heightVar = Math.sin(time * 1.8 + i + layer) * 12 + Math.sin(time * 1.1 + i * 2) * 8
          const y = flameY - flameHeight * Math.sin(t * Math.PI) - heightVar

          // Pixelate the coordinates
          const px = Math.round(x / 4) * 4
          const py = Math.round(y / 4) * 4
          ctx.lineTo(px, py)
        }

        ctx.lineTo(flameX + flameWidth, flameY)
        ctx.closePath()
        ctx.fill()
      }

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
            color = "#4a3728"
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
