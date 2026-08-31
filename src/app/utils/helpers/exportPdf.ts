import {
  createExportFileName,
  type ExportFileOptions,
} from "@/app/utils/helpers/exportTypes";

export async function exportToPdf<T>({
  title,
  fileName,
  columns,
  data,
  filters = [],
}: ExportFileOptions<T>) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const orientation = columns.length > 5 ? "landscape" : "portrait";
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });

  doc.setFontSize(16);
  doc.setTextColor(16, 59, 181);
  doc.text(title, 14, 16);

  let startY = 23;
  if (filters.length > 0) {
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    doc.text("Applied Filters", 14, startY);
    startY += 5;

    filters.forEach((filter) => {
      doc.text(`${filter.label}: ${filter.value}`, 14, startY);
      startY += 4.5;
    });
    startY += 2;
  }

  autoTable(doc, {
    startY,
    head: [columns.map((column) => column.label)],
    body: data.map((row, rowIndex) =>
      columns.map((column) => String(column.value(row, rowIndex) ?? "")),
    ),
    styles: {
      fontSize: 8,
      cellPadding: 2.3,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [16, 59, 181],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 249, 252],
    },
    margin: { left: 10, right: 10 },
    didDrawPage: () => {
      const pageCount = doc.getNumberOfPages();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(
        `Page ${pageCount}`,
        pageWidth - 10,
        pageHeight - 6,
        { align: "right" },
      );
    },
  });

  doc.save(`${createExportFileName(fileName)}.pdf`);
}
