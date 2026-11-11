import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchTimeSheet, TimeSheet } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { formatHoursMinutes, monthLabel } from '../utils/scheduleDates';
import './timesheet-print.css';

const LEGAL_TEXTS = [
  'Registro realizado en cumplimiento de la obligación establecida en el Art. 12.4 c) del Real Decreto Legislativo 2/2015 de 23 de Octubre por el que se establece que "La jornada de los trabajadores a tiempo parcial se registrará día a día y se totalizará mensualmente, entregando copia al trabajador, junto con el recibo de salarios, del resumen de todas las horas realizadas en cada mes, tanto de las ordinarias como de las complementarias en sus distintas modalidades."',
  'Registro realizado en cumplimiento de la obligación establecida en el Art. 34.9 del Real Decreto Legislativo 2/2015 de 23 de Octubre por el que se establece que "La empresa garantizará el registro diario de jornada, que deberá incluir el horario concreto de inicio y finalización de la jornada de trabajo de cada persona trabajadora, sin perjuicio de la flexibilidad horaria que se establece en este artículo" modificado por RDL 8/2019.',
  'El empresario deberá conservar los resúmenes mensuales de los registros de jornada durante un período mínimo de cuatro años. En incumplimiento de esta obligación en el caso de trabajadores a tiempo parcial tendrá por consecuencia jurídica la de que el contrato se presuma celebrado a jornada completa, salvo prueba en contrario que acredite el carácter parcial de los servicios.',
];

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function TimeSheetPrintPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [sheet, setSheet] = useState<TimeSheet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));
  // Only admins can ask for someone else's sheet; employees always get their own.
  const userId = user?.role === 'admin' ? searchParams.get('userId') : null;

  useEffect(() => {
    if (!year || !month) {
      setError('Falta el mes a exportar.');
      return;
    }
    fetchTimeSheet(userId, year, month)
      .then(setSheet)
      .catch((err) => setError(err?.response?.data?.message ?? 'No se pudo cargar el registro de jornada.'));
  }, [userId, year, month]);

  useEffect(() => {
    if (sheet) {
      document.title = `Registro de jornada - ${sheet.employee.name} - ${capitalize(monthLabel(sheet.month - 1))} ${sheet.year}`;
    }
  }, [sheet]);

  if (error) {
    return (
      <div className="timesheet-message">
        <p>{error}</p>
        <Link to="/fichajes">Volver a Fichajes</Link>
      </div>
    );
  }

  if (!sheet) {
    return <div className="timesheet-message">Cargando...</div>;
  }

  if (sheet.issues.length > 0) {
    return (
      <div className="timesheet-message">
        <h2>No se puede exportar este mes todavía</h2>
        <p>Estos días tienen fichajes que el registro de jornada no puede representar:</p>
        <ul>
          {sheet.issues.map((issue) => (
            <li key={`${issue.date}-${issue.message}`}>
              {issue.date.split('-').reverse().join('/')}: {issue.message}
            </li>
          ))}
        </ul>
        <Link to="/fichajes">Volver a Fichajes</Link>
      </div>
    );
  }

  const value = (text: string | null | undefined) => text ?? '';

  return (
    <div className="timesheet-print">
      <div className="timesheet-toolbar">
        <button type="button" onClick={() => window.print()}>
          Imprimir / Guardar como PDF
        </button>
      </div>

      <article className="timesheet-sheet">
        <table className="ts-table">
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '9.5%' }} />
            <col style={{ width: '9.5%' }} />
            <col style={{ width: '9.5%' }} />
            <col style={{ width: '9.5%' }} />
            <col style={{ width: '9.5%' }} />
            <col style={{ width: '9.5%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '29%' }} />
          </colgroup>
          <thead>
            <tr>
              <th colSpan={9} className="ts-title">
                REGISTRO DIARIO DE JORNADA
              </th>
            </tr>
            <tr>
              <th colSpan={5} className="ts-band">
                EMPRESA
              </th>
              <th colSpan={4} className="ts-band">
                TRABAJADOR
              </th>
            </tr>
            <tr>
              <th colSpan={2} className="ts-label">
                Nombre o Razón Social:
              </th>
              <td colSpan={3} className="ts-value">
                {value(sheet.company.legalName)}
              </td>
              <th className="ts-label">Nombre:</th>
              <td colSpan={3} className="ts-value">
                {sheet.employee.name}
              </td>
            </tr>
            <tr>
              <th colSpan={2} className="ts-label">
                CIF:
              </th>
              <td colSpan={3} className="ts-value">
                {value(sheet.company.cif)}
              </td>
              <th className="ts-label">NIF:</th>
              <td colSpan={3} className="ts-value">
                {value(sheet.employee.nif)}
              </td>
            </tr>
            <tr>
              <th colSpan={2} className="ts-label">
                C.C.C.:
              </th>
              <td colSpan={3} className="ts-value">
                {value(sheet.company.ccc)}
              </td>
              <th className="ts-label">NAF:</th>
              <td colSpan={3} className="ts-value">
                {value(sheet.employee.naf)}
              </td>
            </tr>
            <tr>
              <th colSpan={2} className="ts-label">
                Mes y año:
              </th>
              <td colSpan={3} className="ts-value">
                {capitalize(monthLabel(sheet.month - 1))} {sheet.year}
              </td>
              <th className="ts-label" />
              <td colSpan={3} className="ts-value" />
            </tr>
            <tr className="ts-head">
              <th rowSpan={2}>Día</th>
              <th colSpan={2}>Mañana</th>
              <th colSpan={2}>Tarde</th>
              <th rowSpan={2}>Total Horas Jornada</th>
              <th rowSpan={2}>Horas extras</th>
              <th rowSpan={2}>Horas Complem.</th>
              <th rowSpan={2}>FIRMA DEL TRABAJADOR</th>
            </tr>
            <tr className="ts-head ts-subhead">
              <th>Hora entrada</th>
              <th>Hora salida</th>
              <th>Hora entrada</th>
              <th>Hora salida</th>
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((row) => (
              <tr key={row.day} className="ts-row">
                <td className="ts-day">{row.day}</td>
                <td>{row.morning?.in ?? ''}</td>
                <td>{row.morning?.out ?? ''}</td>
                <td>{row.afternoon?.in ?? ''}</td>
                <td>{row.afternoon?.out ?? ''}</td>
                <td>{row.totalMinutes != null ? formatHoursMinutes(row.totalMinutes) : ''}</td>
                <td />
                <td />
                <td />
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="ts-total">
              <th colSpan={5}>Total Mes</th>
              <td>{formatHoursMinutes(sheet.totalMinutes)}</td>
              <td />
              <td />
              <td />
            </tr>
          </tfoot>
        </table>

        <div className="ts-signatures">
          <div className="ts-signature">
            <div className="ts-signature-title">Firma de la Empresa</div>
          </div>
          <div className="ts-signature">
            <div className="ts-signature-title">Firma del Trabajador</div>
          </div>
        </div>

        <div className="ts-legal">
          {LEGAL_TEXTS.map((text) => (
            <p key={text.slice(0, 40)}>{text}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
