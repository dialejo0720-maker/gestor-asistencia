import jsPDF from 'jspdf';
import { Employee } from './types';

interface PayrollData {
  horasNormales: number;
  horasExtras: number;
  horasFestivas: number;
  diasTrabajados: number;
  diasAusentes: number;
}

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

export function generatePayrollPDF(
  empleado: Employee,
  data: PayrollData,
  mes: number,
  ano: number
) {
  const doc = new jsPDF();
  const salarioDiario = empleado.salario_diario || 30000;
  const valorHoraNormal = salarioDiario / 8;

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE NÓMINA', 20, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Gestor de Asistencia', 20, 28);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL EMPLEADO', 20, 50);
  doc.setDrawColor(37, 99, 235);
  doc.line(20, 52, 190, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Empleado: ${empleado.nombre}`, 20, 60);
  doc.text(`Tienda: ${empleado.store}`, 20, 68);
  doc.text(`Rol: ${empleado.rol}`, 20, 76);
  doc.text(`Período: ${MESES[mes - 1]} / ${ano}`, 110, 60);
  doc.text(`Días trabajados: ${data.diasTrabajados}`, 110, 68);
  doc.text(`Días ausentes: ${data.diasAusentes}`, 110, 76);

  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE HORAS', 20, 95);
  doc.line(20, 97, 190, 97);

  const headers = ['Concepto', 'Horas', 'Valor/Hora', 'Total'];
  const colWidths = [70, 30, 40, 40];
  let startX = 20;
  doc.setFillColor(243, 244, 246);
  doc.rect(20, 100, 170, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  headers.forEach((h, i) => {
    doc.text(h, startX + 2, 106);
    startX += colWidths[i];
  });

  const items = [
    {
      nombre: 'Horas Normales',
      horas: data.horasNormales,
      valorHora: valorHoraNormal,
      factor: 1,
    },
    {
      nombre: 'Horas Extras (25%)',
      horas: data.horasExtras,
      valorHora: valorHoraNormal * 1.25,
      factor: 1.25,
    },
    {
      nombre: 'Horas Festivas (100%)',
      horas: data.horasFestivas,
      valorHora: valorHoraNormal * 2,
      factor: 2,
    },
  ];

  let totalBruto = 0;
  let rowY = 115;
  doc.setFont('helvetica', 'normal');

  items.forEach((item, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(20, rowY - 5, 170, 8, 'F');
    }
    const total = item.horas * item.valorHora;
    totalBruto += total;
    startX = 20;
    const row = [
      item.nombre,
      item.horas.toFixed(2),
      `$${Math.round(item.valorHora).toLocaleString('es-CO')}`,
      `$${Math.round(total).toLocaleString('es-CO')}`,
    ];
    row.forEach((cell, i) => {
      doc.text(cell, startX + 2, rowY);
      startX += colWidths[i];
    });
    rowY += 10;
  });

  doc.setDrawColor(200, 200, 200);
  doc.line(20, rowY, 190, rowY);
  rowY += 8;

  const descuentoSalud = totalBruto * 0.04;
  const descuentoPension = totalBruto * 0.04;
  const totalDescuentos = descuentoSalud + descuentoPension;
  const totalNeto = totalBruto - totalDescuentos;

  doc.setFont('helvetica', 'normal');
  doc.text('Descuento Salud (4%)', 20, rowY);
  doc.text(`-$${Math.round(descuentoSalud).toLocaleString('es-CO')}`, 160, rowY);
  rowY += 8;
  doc.text('Descuento Pensión (4%)', 20, rowY);
  doc.text(`-$${Math.round(descuentoPension).toLocaleString('es-CO')}`, 160, rowY);
  rowY += 8;

  doc.setFillColor(37, 99, 235);
  doc.rect(20, rowY, 170, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL A PAGAR', 24, rowY + 8);
  doc.text(`$${Math.round(totalNeto).toLocaleString('es-CO')}`, 150, rowY + 8);

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Generado por Gestor de Asistencia & Nómina', 20, 285);
  doc.text(new Date().toLocaleDateString('es-CO'), 160, 285);

  return doc;
}
