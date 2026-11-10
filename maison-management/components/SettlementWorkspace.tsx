'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Model = { id: string; name: string }
type Term = {
  id: string
  model_id: string
  commission_rate: number
  status: 'proposed' | 'active' | 'rejected' | 'expired'
  agreement_reference: string | null
  accepted_at: string | null
  created_at: string
}
type Settlement = {
  id: string
  model_id: string
  period_start: string
  period_end: string
  currency: string
  platform_gross: number
  platform_fees: number
  refunds: number
  adjustments: number
  commission_rate: number
  distributable_amount: number
  agency_amount: number
  creator_amount: number
  status: 'draft' | 'under_review' | 'approved' | 'paid' | 'void'
  source_report_reference: string | null
  payment_reference: string | null
  models?: { display_name: string } | null
}
const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0))
const today = () => new Date().toISOString().slice(0, 10)
const monthStart = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
const monthEnd = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
}
const statusLabel: Record<Settlement['status'], string> = {
  draft: 'Borrador',
  under_review: 'En revisión',
  approved: 'Aprobada',
  paid: 'Pagada',
  void: 'Anulada',
}
const termLabel: Record<Term['status'], string> = {
  proposed: 'Propuesta',
  active: 'Activa',
  rejected: 'Rechazada',
  expired: 'Finalizada',
}

export default function SettlementWorkspace({ models, supabase }: { models: Model[]; supabase: SupabaseClient }) {
  const [terms, setTerms] = useState<Term[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [rate, setRate] = useState('30')
  const [agreementReference, setAgreementReference] = useState('')
  const [signedConfirmed, setSignedConfirmed] = useState(false)
  const [periodStart, setPeriodStart] = useState(monthStart())
  const [periodEnd, setPeriodEnd] = useState(monthEnd())
  const [gross, setGross] = useState('')
  const [fees, setFees] = useState('')
  const [refunds, setRefunds] = useState('')
  const [adjustments, setAdjustments] = useState('0')
  const [reportReference, setReportReference] = useState('')
  const [paymentReference, setPaymentReference] = useState('')

  const activeTerms = useMemo(() => terms.filter(t => t.status === 'active'), [terms])
  const activeTerm = activeTerms.find(t => t.model_id === selectedModel)
  const selectedName = models.find(m => m.id === selectedModel)?.name || 'Modelo'

  async function load() {
    setLoading(true)
    setError('')
    const [termResult, settlementResult] = await Promise.all([
      supabase.from('model_compensation_terms').select('id,model_id,commission_rate,status,agreement_reference,accepted_at,created_at').order('created_at', { ascending: false }),
      supabase.from('monthly_settlements').select('id,model_id,period_start,period_end,currency,platform_gross,platform_fees,refunds,adjustments,commission_rate,distributable_amount,agency_amount,creator_amount,status,source_report_reference,payment_reference,models(display_name)').order('period_start', { ascending: false }),
    ])
    if (termResult.error) setError(termResult.error.message)
    else setTerms((termResult.data || []) as Term[])
    if (settlementResult.error) setError(settlementResult.error.message)
    else setSettlements((settlementResult.data || []) as unknown as Settlement[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [supabase, models.length])

  async function saveProposal() {
    setError('')
    setNotice('')
    const model = models.find(m => m.id === selectedModel)
    const numericRate = Number(rate)
    if (!model) return setError('Primero registra una modelo en el CRM.')
    if (!Number.isFinite(numericRate) || numericRate < 0 || numericRate > 100) return setError('La comisión debe estar entre 0 y 100.')
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return setError('La sesión no está disponible.')
    const existing = terms.find(t => t.model_id === model.id && t.status === 'proposed')
    const result = existing
      ? await supabase.from('model_compensation_terms').update({ commission_rate: numericRate, settlement_frequency: 'monthly', calculation_basis: 'platform_net', agreement_reference: agreementReference.trim() || null }).eq('id', existing.id)
      : await supabase.from('model_compensation_terms').insert({ model_id: model.id, commission_rate: numericRate, settlement_frequency: 'monthly', calculation_basis: 'platform_net', status: 'proposed', agreement_reference: agreementReference.trim() || null, created_by: auth.user.id })
    if (result.error) return setError(result.error.message)
    setNotice('Propuesta guardada. Todavía no se aplicará a las liquidaciones hasta registrar la aceptación y activar el acuerdo.')
    await load()
  }

  async function activateTerm(term: Term) {
    setError('')
    setNotice('')
    if (!signedConfirmed || !agreementReference.trim()) return setError('Confirma que el acuerdo fue firmado y registra su referencia antes de activar la comisión.')
    const { error: updateError } = await supabase.from('model_compensation_terms').update({
      status: 'active',
      accepted_at: new Date().toISOString(),
      effective_from: today(),
      agreement_reference: agreementReference.trim(),
    }).eq('id', term.id).eq('status', 'proposed')
    if (updateError) return setError(updateError.message)
    setSignedConfirmed(false)
    setNotice('Acuerdo activado. La comisión acordada queda disponible para nuevas liquidaciones.')
    await load()
  }

  async function createSettlement(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!activeTerm) return setError('No existe un acuerdo activo para esta modelo. Registra y activa primero el acuerdo firmado.')
    const g = Number(gross), f = Number(fees || 0), r = Number(refunds || 0), a = Number(adjustments || 0)
    if (!Number.isFinite(g) || !Number.isFinite(f) || !Number.isFinite(r) || !Number.isFinite(a) || g < 0 || f < 0 || r < 0 || g - f - r + a < 0) return setError('Revisa los importes: la base distribuible no puede ser negativa.')
    if (!periodStart || !periodEnd || periodEnd < periodStart) return setError('El periodo de liquidación no es válido.')
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return setError('La sesión no está disponible.')
    const { error: insertError } = await supabase.from('monthly_settlements').insert({
      model_id: selectedModel,
      period_start: periodStart,
      period_end: periodEnd,
      currency: 'USD',
      platform_gross: g,
      platform_fees: f,
      refunds: r,
      adjustments: a,
      commission_rate: activeTerm.commission_rate,
      source_report_reference: reportReference.trim() || null,
      created_by: auth.user.id,
      status: 'draft',
    })
    if (insertError) return setError(insertError.message)
    setGross(''); setFees(''); setRefunds(''); setAdjustments('0'); setReportReference('')
    setNotice('Liquidación creada como borrador. Revisa el reporte de origen antes de aprobarla.')
    await load()
  }

  async function changeStatus(row: Settlement, next: Settlement['status']) {
    setError('')
    setNotice('')
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return setError('La sesión no está disponible.')
    const patch: Record<string, unknown> = { status: next, updated_at: new Date().toISOString() }
    if (next === 'approved') { patch.approved_by = auth.user.id; patch.approved_at = new Date().toISOString() }
    if (next === 'paid') {
      if (!paymentReference.trim()) return setError('Introduce la referencia del pago antes de marcar la liquidación como pagada.')
      patch.paid_at = new Date().toISOString()
      patch.payment_reference = paymentReference.trim()
    }
    const { error: updateError } = await supabase.from('monthly_settlements').update(patch).eq('id', row.id)
    if (updateError) return setError(updateError.message)
    setPaymentReference('')
    setNotice('Estado de liquidación actualizado.')
    await load()
  }

  return <section className="panel" style={{ padding: 22, marginTop: 22 }}>
    <div className="section-head">
      <div><h2>Comisiones y liquidaciones mensuales</h2><p className="page-intro">Comisión propuesta del 30%. Solo se activa después de documentar la aceptación del acuerdo.</p></div>
      <button className="btn-ghost" onClick={() => void load()} disabled={loading}>{loading ? 'Actualizando…' : 'Actualizar'}</button>
    </div>
    {error && <div className="notice inbox-feedback-error">{error}</div>}
    {notice && <div className="notice">{notice}</div>}
    {models.length === 0 ? <div className="empty">Registra primero la primera modelo en la sección Modelos para configurar su acuerdo.</div> : <>
      <div className="finance-filter" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, alignItems: 'end' }}>
        <label className="field">Modelo<select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}><option value="">Seleccionar modelo</option>{models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <label className="field">Comisión propuesta (%)<input type="number" min="0" max="100" step="0.01" value={rate} onChange={e => setRate(e.target.value)} /></label>
        <label className="field">Referencia del acuerdo<input value={agreementReference} onChange={e => setAgreementReference(e.target.value)} placeholder="Contrato firmado / ID interno" /></label>
        <button className="btn" onClick={() => void saveProposal()}>Guardar propuesta</button>
      </div>
      <div className="panel" style={{ padding: 16, marginTop: 14 }}>
        <h3 className="panel-title">Acuerdos por modelo</h3>
        {models.map(model => {
          const term = terms.find(t => t.model_id === model.id)
          return <div key={model.id} className="activity-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div><strong>{model.name}</strong><small>{term ? term.commission_rate + '% · ' + termLabel[term.status] : 'Sin propuesta'}</small></div>
            {term?.status === 'proposed' && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={signedConfirmed} onChange={e => setSignedConfirmed(e.target.checked)} />Acuerdo firmado</label>
              <button className="btn" onClick={() => void activateTerm(term)}>Activar acuerdo</button>
            </div>}
            {term?.status === 'active' && <span className="status">Vigente</span>}
          </div>
        })}
      </div>
      <form onSubmit={createSettlement} className="panel" style={{ padding: 16, marginTop: 14 }}>
        <h3 className="panel-title">Crear liquidación mensual</h3>
        <p className="muted">{activeTerm ? 'Comisión vigente para ' + selectedName + ': ' + activeTerm.commission_rate + '%' : 'Selecciona una modelo con acuerdo activo para crear una liquidación.'}</p>
        <div className="finance-filter" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
          <label className="field">Desde<input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required /></label>
          <label className="field">Hasta<input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} required /></label>
          <label className="field">Ingresos brutos USD<input type="number" min="0" step="0.01" value={gross} onChange={e => setGross(e.target.value)} required /></label>
          <label className="field">Comisiones plataforma USD<input type="number" min="0" step="0.01" value={fees} onChange={e => setFees(e.target.value)} /></label>
          <label className="field">Reembolsos USD<input type="number" min="0" step="0.01" value={refunds} onChange={e => setRefunds(e.target.value)} /></label>
          <label className="field">Ajustes USD<input type="number" step="0.01" value={adjustments} onChange={e => setAdjustments(e.target.value)} /></label>
          <label className="field">Referencia del reporte<input value={reportReference} onChange={e => setReportReference(e.target.value)} placeholder="Exportación / periodo" /></label>
        </div>
        <button className="btn" type="submit" disabled={!activeTerm}>Crear borrador de liquidación</button>
      </form>
    </>}
    <div className="section-head" style={{ marginTop: 22 }}><h3>Historial de liquidaciones</h3></div>
    <div className="table-wrap"><table className="data-table"><thead><tr><th>MODELO</th><th>PERIODO</th><th>BASE</th><th>COMISIÓN</th><th>AGENCIA</th><th>CREADORA</th><th>ESTADO</th><th>ACCIÓN</th></tr></thead><tbody>
      {settlements.map(row => <tr key={row.id}>
        <td>{row.models?.display_name || models.find(m => m.id === row.model_id)?.name || 'Modelo'}</td>
        <td>{row.period_start} — {row.period_end}</td>
        <td>{money(row.distributable_amount)}</td>
        <td>{row.commission_rate}%</td>
        <td>{money(row.agency_amount)}</td>
        <td>{money(row.creator_amount)}</td>
        <td>{statusLabel[row.status]}</td>
        <td>{row.status === 'draft' && <button className="btn-ghost" onClick={() => void changeStatus(row, 'under_review')}>Enviar revisión</button>}
          {row.status === 'under_review' && <button className="btn-ghost" onClick={() => void changeStatus(row, 'approved')}>Aprobar</button>}
          {row.status === 'approved' && <div style={{ display: 'grid', gap: 6 }}><input value={paymentReference} onChange={e => setPaymentReference(e.target.value)} placeholder="Referencia de pago" /><button className="btn-ghost" onClick={() => void changeStatus(row, 'paid')}>Marcar pagada</button></div>}
          {row.status === 'paid' && <span className="muted">{row.payment_reference || 'Pagada'}</span>}
        </td>
      </tr>)}
      {!loading && settlements.length === 0 && <tr><td colSpan={8}><div className="empty">Todavía no hay liquidaciones.</div></td></tr>}
    </tbody></table></div>
  </section>
}
