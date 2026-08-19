import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  TOLERANCIA_FIRMA_SEGUNDOS,
  faltantesDeMercadoPago,
  mercadoPagoConfigurado,
  modoMercadoPago,
  traducirEstadoPago,
  verificarFirmaWebhook,
} from '../pagos/mercadopago'

const SECRETO = 'secreto-de-prueba'

function firmar(dataId: string, requestId: string, ts: string, secreto = SECRETO) {
  const manifiesto = `id:${dataId};request-id:${requestId};ts:${ts};`
  return createHmac('sha256', secreto).update(manifiesto).digest('hex')
}

describe('modo de Mercado Pago', () => {
  const original = { ...process.env }
  afterEach(() => {
    process.env = { ...original }
  })

  it('está deshabilitado sin access token', () => {
    delete process.env.MERCADO_PAGO_ACCESS_TOKEN
    expect(modoMercadoPago()).toBe('deshabilitado')
    expect(mercadoPagoConfigurado()).toBe(false)
  })

  it('distingue prueba de producción por el prefijo TEST-', () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = 'TEST-1234'
    expect(modoMercadoPago()).toBe('prueba')
    process.env.MERCADO_PAGO_ACCESS_TOKEN = 'APP_USR-1234'
    expect(modoMercadoPago()).toBe('produccion')
  })

  it('informa qué variable falta, sin revelar valores', () => {
    delete process.env.MERCADO_PAGO_ACCESS_TOKEN
    delete process.env.MERCADO_PAGO_WEBHOOK_SECRET
    const faltan = faltantesDeMercadoPago()
    expect(faltan).toContain('MERCADO_PAGO_ACCESS_TOKEN')
    expect(faltan).toContain('MERCADO_PAGO_WEBHOOK_SECRET')
  })
})

describe('verificarFirmaWebhook', () => {
  // Las firmas ahora caducan, así que los casos válidos se firman con la hora
  // actual. Un `ts` fijo probaría el rechazo por vencimiento, no la firma.
  const ahora = () => String(Math.floor(Date.now() / 1000))

  beforeEach(() => {
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = SECRETO
  })

  it('acepta una firma legítima', () => {
    const ts = ahora()
    const r = verificarFirmaWebhook({
      signature: `ts=${ts},v1=${firmar('12345', 'req-1', ts)}`,
      requestId: 'req-1',
      dataId: '12345',
    })
    expect(r.valida).toBe(true)
  })

  it('rechaza una firma calculada con otro secreto', () => {
    const ts = ahora()
    const r = verificarFirmaWebhook({
      signature: `ts=${ts},v1=${firmar('12345', 'req-1', ts, 'otro-secreto')}`,
      requestId: 'req-1',
      dataId: '12345',
    })
    expect(r.valida).toBe(false)
  })

  it('rechaza si cambia el id del pago', () => {
    const ts = ahora()
    const firma = firmar('12345', 'req-1', ts)
    const r = verificarFirmaWebhook({
      signature: `ts=${ts},v1=${firma}`,
      requestId: 'req-1',
      dataId: '99999',
    })
    expect(r.valida).toBe(false)
  })

  it('rechaza si cambia el request-id', () => {
    const ts = ahora()
    const firma = firmar('12345', 'req-1', ts)
    const r = verificarFirmaWebhook({
      signature: `ts=${ts},v1=${firma}`,
      requestId: 'req-2',
      dataId: '12345',
    })
    expect(r.valida).toBe(false)
  })

  it('rechaza cabeceras ausentes o mal formadas', () => {
    expect(verificarFirmaWebhook({ signature: null, requestId: 'r', dataId: '1' }).valida).toBe(
      false,
    )
    expect(
      verificarFirmaWebhook({ signature: 'basura', requestId: 'r', dataId: '1' }).valida,
    ).toBe(false)
    expect(
      verificarFirmaWebhook({ signature: 'ts=1,v1=zz', requestId: 'r', dataId: null }).valida,
    ).toBe(false)
  })

  it('no valida nada si falta el secreto configurado', () => {
    delete process.env.MERCADO_PAGO_WEBHOOK_SECRET
    const ts = ahora()
    const r = verificarFirmaWebhook({
      signature: `ts=${ts},v1=${firmar('12345', 'req-1', ts)}`,
      requestId: 'req-1',
      dataId: '12345',
    })
    expect(r.valida).toBe(false)
    expect(r.motivo).toContain('MERCADO_PAGO_WEBHOOK_SECRET')
  })

  it('no se rompe con una firma de largo distinto', () => {
    const r = verificarFirmaWebhook({
      signature: 'ts=1,v1=abcd',
      requestId: 'r',
      dataId: '1',
    })
    expect(r.valida).toBe(false)
  })
})

describe('traducirEstadoPago', () => {
  it('mapea los estados conocidos', () => {
    expect(traducirEstadoPago('approved')).toBe('approved')
    expect(traducirEstadoPago('authorized')).toBe('approved')
    expect(traducirEstadoPago('rejected')).toBe('rejected')
    expect(traducirEstadoPago('cancelled')).toBe('cancelled')
    expect(traducirEstadoPago('refunded')).toBe('refunded')
    expect(traducirEstadoPago('charged_back')).toBe('refunded')
  })

  it('trata lo desconocido como pendiente, nunca como aprobado', () => {
    expect(traducirEstadoPago('in_process')).toBe('pending')
    expect(traducirEstadoPago('estado_futuro_inventado')).toBe('pending')
    expect(traducirEstadoPago('')).toBe('pending')
  })
})

describe('verificarFirmaWebhook · frescura', () => {
  beforeEach(() => {
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = SECRETO
  })

  const conDesfase = (segundos: number) => {
    const ts = String(Math.floor(Date.now() / 1000) + segundos)
    return verificarFirmaWebhook({
      signature: `ts=${ts},v1=${firmar('12345', 'req-1', ts)}`,
      requestId: 'req-1',
      dataId: '12345',
    })
  }

  it('acepta una firma dentro de la ventana', () => {
    expect(conDesfase(-(TOLERANCIA_FIRMA_SEGUNDOS - 60)).valida).toBe(true)
  })

  it('rechaza una firma vieja aunque el HMAC sea correcto', () => {
    // Éste es el caso de reenvío: la firma es criptográficamente válida, pero
    // fue capturada hace horas.
    const r = conDesfase(-(TOLERANCIA_FIRMA_SEGUNDOS + 60))
    expect(r.valida).toBe(false)
    expect(r.motivo).toBe('Firma vencida')
  })

  it('rechaza una firma con ts en el futuro lejano', () => {
    expect(conDesfase(TOLERANCIA_FIRMA_SEGUNDOS + 60).valida).toBe(false)
  })

  it('rechaza un ts que no es un número', () => {
    const r = verificarFirmaWebhook({
      signature: 'ts=ayer,v1=abcd',
      requestId: 'req-1',
      dataId: '12345',
    })
    expect(r.valida).toBe(false)
  })
})
