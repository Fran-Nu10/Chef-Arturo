import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
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
  beforeEach(() => {
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = SECRETO
  })

  it('acepta una firma legítima', () => {
    const ts = '1700000000'
    const r = verificarFirmaWebhook({
      signature: `ts=${ts},v1=${firmar('12345', 'req-1', ts)}`,
      requestId: 'req-1',
      dataId: '12345',
    })
    expect(r.valida).toBe(true)
  })

  it('rechaza una firma calculada con otro secreto', () => {
    const ts = '1700000000'
    const r = verificarFirmaWebhook({
      signature: `ts=${ts},v1=${firmar('12345', 'req-1', ts, 'otro-secreto')}`,
      requestId: 'req-1',
      dataId: '12345',
    })
    expect(r.valida).toBe(false)
  })

  it('rechaza si cambia el id del pago', () => {
    const ts = '1700000000'
    const firma = firmar('12345', 'req-1', ts)
    const r = verificarFirmaWebhook({
      signature: `ts=${ts},v1=${firma}`,
      requestId: 'req-1',
      dataId: '99999',
    })
    expect(r.valida).toBe(false)
  })

  it('rechaza si cambia el request-id', () => {
    const ts = '1700000000'
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
    const ts = '1700000000'
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
