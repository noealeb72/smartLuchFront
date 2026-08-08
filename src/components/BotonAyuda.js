import React, { useState } from 'react';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addPdfReportHeader } from '../utils/pdfReportHeader';

/**
 * Botón "Ayuda" para pantallas de administración: abre un popup con un manual
 * (armado a partir de `contenido`, un array de bloques {tipo, ...}) y permite
 * descargar ese mismo manual en PDF. El popup y el PDF comparten la misma
 * fuente de contenido para que no puedan desincronizarse.
 *
 * Bloques soportados en `contenido`:
 *   { tipo: 'parrafo', texto }
 *   { tipo: 'subtitulo', texto }
 *   { tipo: 'lista', items: [...] }
 *   { tipo: 'tabla', head: [...], body: [[...], ...] }
 */
const BotonAyuda = ({ titulo, contenido, nombreArchivo, icono = 'fa-circle-question' }) => {
  const [mostrar, setMostrar] = useState(false);

  const handleDescargarPDF = async () => {
    try {
      const doc = new jsPDF();
      let y = await addPdfReportHeader(doc, titulo);
      const marginLeft = 14;
      const marginRight = 196;
      const pageBottom = 280;

      const asegurarEspacio = (alturaNecesaria) => {
        if (y + alturaNecesaria > pageBottom) {
          doc.addPage();
          y = 20;
        }
      };

      contenido.forEach((bloque) => {
        if (bloque.tipo === 'subtitulo') {
          asegurarEspacio(12);
          y += 4;
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text(bloque.texto, marginLeft, y);
          doc.setFont(undefined, 'normal');
          y += 7;
        } else if (bloque.tipo === 'parrafo') {
          doc.setFontSize(10);
          const lineas = doc.splitTextToSize(bloque.texto, marginRight - marginLeft);
          lineas.forEach((linea) => {
            asegurarEspacio(6);
            doc.text(linea, marginLeft, y);
            y += 5.5;
          });
          y += 2;
        } else if (bloque.tipo === 'lista') {
          doc.setFontSize(10);
          bloque.items.forEach((item) => {
            const lineas = doc.splitTextToSize(`•  ${item}`, marginRight - marginLeft);
            lineas.forEach((linea, idx) => {
              asegurarEspacio(6);
              doc.text(linea, marginLeft + (idx === 0 ? 0 : 4), y);
              y += 5.5;
            });
          });
          y += 2;
        } else if (bloque.tipo === 'tabla') {
          asegurarEspacio(20);
          doc.autoTable({
            startY: y,
            head: [bloque.head],
            body: bloque.body,
            styles: { fontSize: 9, cellPadding: 2.5 },
            headStyles: { fillColor: [52, 58, 64], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: marginLeft, right: 210 - marginRight },
          });
          y = doc.lastAutoTable.finalY + 6;
        }
      });

      doc.save(nombreArchivo);
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Error al generar el manual en PDF', icon: 'error', confirmButtonText: 'Aceptar', confirmButtonColor: '#F34949' });
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn"
        onClick={() => setMostrar(true)}
        style={{ backgroundColor: 'transparent', border: '1px solid white', color: 'white', padding: '0.35rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '1.5rem' }}
      >
        <i className={`fa ${icono}`} aria-hidden="true"></i>
        Ayuda
      </button>

      {mostrar && (
        <>
          <div className="modal-backdrop show" onClick={() => setMostrar(false)}></div>
          <div className="modal show" style={{ display: 'block' }} tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 style={{ margin: 0 }}>
                    <i className={`fa ${icono} mr-2`} aria-hidden="true"></i>
                    {titulo}
                  </h5>
                  <button type="button" className="close" onClick={() => setMostrar(false)} aria-label="Cerrar" style={{ background: 'none', border: 'none', fontSize: '1.5rem', lineHeight: 1 }}>
                    &times;
                  </button>
                </div>
                <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                  {contenido.map((bloque, idx) => {
                    if (bloque.tipo === 'subtitulo') {
                      return <h6 key={idx} style={{ marginTop: idx === 0 ? 0 : '1.5rem', fontWeight: 700 }}>{bloque.texto}</h6>;
                    }
                    if (bloque.tipo === 'parrafo') {
                      return <p key={idx} style={{ fontSize: '0.92rem', color: '#343a40' }}>{bloque.texto}</p>;
                    }
                    if (bloque.tipo === 'lista') {
                      return (
                        <ul key={idx} style={{ fontSize: '0.92rem', color: '#343a40', paddingLeft: '1.2rem' }}>
                          {bloque.items.map((item, i) => <li key={i} style={{ marginBottom: '0.35rem' }}>{item}</li>)}
                        </ul>
                      );
                    }
                    if (bloque.tipo === 'tabla') {
                      return (
                        <div key={idx} className="table-responsive" style={{ marginBottom: '1rem' }}>
                          <table className="table table-sm table-striped table-bordered" style={{ fontSize: '0.85rem' }}>
                            <thead style={{ backgroundColor: '#343a40', color: 'white' }}>
                              <tr>{bloque.head.map((h, i) => <th key={i}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                              {bloque.body.map((fila, i) => (
                                <tr key={i}>{fila.map((celda, j) => <td key={j}>{celda}</td>)}</tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn" onClick={handleDescargarPDF} style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: 'white' }}>
                    <i className="fa fa-file-pdf mr-2" aria-hidden="true"></i>
                    Descargar PDF
                  </button>
                  <button type="button" className="btn" onClick={() => setMostrar(false)} style={{ backgroundColor: '#343A40', borderColor: '#343A40', color: 'white' }}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BotonAyuda;
