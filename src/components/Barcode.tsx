import { useEffect, useRef } from 'react'
import * as bwipjs from 'bwip-js/browser'
import type { BarcodeFormat } from '../lib/types'

const BCID: Record<BarcodeFormat, string> = {
  EAN13: 'ean13',
  CODE128: 'code128',
  QR: 'qrcode',
  AZTEC: 'azteccode',
}

interface BarcodeProps {
  code: string
  format: BarcodeFormat
  dark?: boolean
  scale?: number
  height?: number
}

export function Barcode({ code, format, dark = false, scale = 3, height = 26 }: BarcodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fallbackRef = useRef<HTMLDivElement>(null)
  const is2d = format === 'QR' || format === 'AZTEC'

  useEffect(() => {
    const canvas = canvasRef.current
    const fallback = fallbackRef.current
    if (!canvas || !fallback) return
    try {
      bwipjs.toCanvas(canvas, {
        bcid: BCID[format],
        text: code,
        scale,
        height: is2d ? undefined : height,
        includetext: false,
        paddingwidth: 0,
        paddingheight: 0,
        backgroundcolor: dark ? '000000' : 'FFFFFF',
        barcolor: dark ? 'FFFFFF' : '11151F',
      })
      canvas.style.display = 'block'
      fallback.style.display = 'none'
    } catch {
      canvas.style.display = 'none'
      fallback.style.display = 'block'
    }
  }, [code, format, dark, scale, height, is2d])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          height: 'auto',
          width: is2d ? 'auto' : '100%',
          imageRendering: 'pixelated',
        }}
      />
      <div ref={fallbackRef} className="dim" style={{ display: 'none', fontFamily: 'var(--font-display)', padding: 20 }}>{code}</div>
    </div>
  )
}
