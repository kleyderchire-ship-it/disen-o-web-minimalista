# MAISON MANAGEMENT — Política financiera y liquidaciones
**Versión:** 1.0 · **Estado:** Propuesta comercial pendiente de aceptación contractual

## 1. Comisión propuesta
La propuesta inicial de MAISON MANAGEMENT es una comisión del **30%**. No se activa hasta que la creadora la acepte y ambas partes firmen un acuerdo que defina expresamente la base de cálculo.

## 2. Base de cálculo
El contrato debe determinar si la comisión se calcula sobre ingresos netos recibidos por la creadora o sobre otra base expresamente pactada. Debe especificar el tratamiento de:
- comisiones y cargos de la plataforma;
- reembolsos, contracargos y ajustes;
- impuestos y retenciones;
- gastos operativos y gastos extraordinarios previamente autorizados;
- conversiones de moneda y fechas de corte.

No se deducirá ningún gasto no autorizado por escrito.

## 3. Periodicidad mensual
- Periodo de liquidación: mes calendario, salvo que el contrato establezca otra zona horaria o corte.
- Conciliación: comparar panel oficial de la plataforma, exportaciones disponibles, webhooks y registros manuales.
- Estado inicial: borrador.
- Revisión: supervisor/administración.
- Aprobación: administrador autorizado.
- Pago: dentro del plazo pactado en el contrato y sujeto a fondos efectivamente disponibles.
- Evidencia: conservar reporte, referencia de pago y fecha.

## 4. Fórmula de referencia
Base distribuible = ingresos incluidos en el contrato − deducciones expresamente autorizadas.  
Comisión de agencia = base distribuible × 30%.  
Parte de la creadora = base distribuible − comisión de agencia.

Ejemplo meramente ilustrativo: base distribuible de USD 4,000 → agencia USD 1,200 y creadora USD 2,800.

## 5. Controles
- Separar ventas registradas manualmente de importes conciliados desde la plataforma.
- No considerar una venta pendiente como dinero liquidado.
- Evitar doble contabilización de webhook y carga manual usando referencias únicas.
- Cualquier ajuste requiere motivo, responsable y evidencia.
- El chatter no puede aprobar ni modificar liquidaciones.
- La creadora recibe un estado de cuenta comprensible y puede solicitar aclaraciones.

## 6. Estados del cierre
draft → under_review → approved → paid.  
Los periodos aprobados o pagados no se editan silenciosamente; se corrigen mediante un ajuste trazable.

## 7. Aprobación contractual
La tasa, base, moneda, corte mensual, fecha límite de pago, impuestos, gastos y mecanismo de disputa deben estar firmados antes de cobrar comisión.
