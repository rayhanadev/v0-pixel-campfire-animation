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
      x: baseX + (Math.random() - 0.5) * 30,
      y: baseY,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 2,
      life: 1,
      maxLife: Math.random() * 60 + 40,
      size: Math.random() * 4 + 2,
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ascii = asciiRef.current
    if (!canvas || !ascii) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const width = 200
    const height = 250
    canvas.width = width
    canvas.height = height

    const cellSize = 4
    const cols = Math.floor(width / cellSize)
    const rows = Math.floor(height / cellSize)

    const animate = () => {
      timeRef.current += 0.05
      const time = timeRef.current

      // Clear canvas
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)

      const centerX = width / 2
      const baseY = height - 50

      // Draw logs with 3D perspective
      const logColors = ["#4a3728", "#5c4333", "#3d2b1f", "#6b4423"]
      const logs = [
        { x: centerX - 35, y: baseY + 5, w: 70, h: 12, angle: 0.15 },
        { x: centerX - 30, y: baseY + 15, w: 65, h: 10, angle: -0.1 },
        { x: centerX - 25, y: baseY, w: 55, h: 10, angle: 0.2 },
      ]

      logs.forEach((log, i) => {
        ctx.save()
        ctx.translate(log.x + log.w / 2, log.y + log.h / 2)
        ctx.rotate(log.angle + Math.sin(time * 0.5 + i) * 0.02)
        ctx.fillStyle = logColors[i % logColors.length]
        ctx.fillRect(-log.w / 2, -log.h / 2, log.w, log.h)
        // Pixel detail on logs
        ctx.fillStyle = "#2d1f14"
        for (let j = 0; j < 3; j++) {
          ctx.fillRect(-log.w / 2 + 10 + j * 15, -log.h / 2 + 2, 4, 4)
        }
        ctx.restore()
      })

      // Create flame layers with 3D depth
      const flameCount = 7
      for (let layer = 0; layer < flameCount; layer++) {
        const layerOffset = layer * 0.3
        const depthScale = 1 - layer * 0.08
        const flameHeight = (100 + Math.sin(time * 3 + layer) * 15) * depthScale
        const flameWidth = (40 + Math.sin(time * 2.5 + layer * 0.5) * 8) * depthScale

        // Flame color gradient based on layer (inner = brighter)
        let color: string
        if (layer < 2) {
          color = `rgba(255, 255, 230, ${0.9 - layer * 0.1})`
        } else if (layer < 4) {
          color = `rgba(255, ${200 - layer * 20}, 0, ${0.85 - layer * 0.05})`
        } else {
          color = `rgba(255, ${100 - layer * 10}, 0, ${0.7 - layer * 0.05})`
        }

        const offsetX = Math.sin(time * 4 + layer * 2) * (3 + layer * 2)
        const offsetY = Math.cos(time * 3 + layer) * 2

        // Draw pixelated flame shape
        ctx.fillStyle = color
        const flameX = centerX + offsetX - flameWidth / 2 + (layer - 3) * 5
        const flameY = baseY - 10 + offsetY

        // Create jagged flame top
        ctx.beginPath()
        ctx.moveTo(flameX, flameY)

        const segments = 8
        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const x = flameX + t * flameWidth
          const heightVar = Math.sin(time * 5 + i + layer) * 15 + Math.sin(time * 3 + i * 2) * 10
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
      const gradient = ctx.createRadialGradient(centerX, baseY - 30, 5, centerX, baseY - 30, 35)
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)")
      gradient.addColorStop(0.3, "rgba(255, 255, 150, 0.7)")
      gradient.addColorStop(0.6, "rgba(255, 200, 50, 0.4)")
      gradient.addColorStop(1, "rgba(255, 100, 0, 0)")
      ctx.fillStyle = gradient
      ctx.fillRect(centerX - 40, baseY - 70, 80, 60)

      // Manage particles (sparks/embers)
      if (Math.random() < 0.3) {
        particlesRef.current.push(createParticle(centerX, baseY - 50))
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx + Math.sin(time * 3 + p.y * 0.1) * 0.5
        p.y += p.vy
        p.vy += 0.02 // slight gravity resistance
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
          className="font-mono text-[8px] leading-[8px] tracking-[0px] select-none"
          style={{
            fontFamily: "monospace",
            whiteSpace: "pre",
            textShadow: "0 0 10px rgba(255, 100, 0, 0.3)",
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
