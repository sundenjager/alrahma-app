import axios from 'axios';

const API_URL = "http://localhost:5273/api";

export const printDocument = async (sessionId, documentType, title = "Document") => {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.get(
      `${API_URL}/documents/download/${encodeURIComponent(documentType)}/${sessionId}`,
      {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const blob = new Blob([response.data], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { margin: 0; }
            iframe { width: 100%; height: 100vh; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${blobUrl}" onload="this.contentWindow.focus(); this.contentWindow.print();"></iframe>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (error) {
    console.error("Error printing document:", error);
    alert("فشل تحميل الوثيقة أو طباعتها");
  }
};
