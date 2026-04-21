import { jsPDF } from "jspdf";

export function generateQuestionsPDF(questions, title = "Questões - QuestBook") {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  doc.setFontSize(10);
  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, margin, yPosition);
  yPosition += 15;

  const gabarito = [];

  questions.forEach((q, index) => {
    const questionNumber = index + 1;

    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const questionText = `${questionNumber}) ${stripHtml(q.enunciado || "Enunciado não disponível")}`;
    
    const splitTitle = doc.splitTextToSize(questionText, maxWidth);
    doc.text(splitTitle, margin, yPosition);
    yPosition += splitTitle.length * 6 + 4;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const alternativas = q.alternativas || {};
    const letters = ["A", "B", "C", "D", "E"];

    letters.forEach((letter) => {
      if (alternativas[letter]) {
        const altText = `${letter}) ${stripHtml(alternativas[letter])}`;
        const splitAlt = doc.splitTextToSize(altText, maxWidth - 10);
        
        if (yPosition + splitAlt.length * 5 > 280) {
          doc.addPage();
          yPosition = 20;
        }

        doc.text(splitAlt, margin + 5, yPosition);
        yPosition += splitAlt.length * 5 + 2;
      }
    });

    yPosition += 8;
    gabarito.push({ numero: questionNumber, resposta: q.gabarito });
  });

  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Gabarito", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  gabarito.forEach((g, index) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(`${g.numero}) ${g.resposta}`, margin + 5, yPosition);
    yPosition += 7;
  });

  doc.save("questoes_questbook.pdf");
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}
