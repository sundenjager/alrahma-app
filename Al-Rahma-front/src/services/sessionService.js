// sessionsService.js
import { apiClient } from '../config/api'; // ✅ Use centralized client

export const createSession = async (sessionData) => {
    try {
        const formData = new FormData();
        
        // Basic session info
        formData.append('SessionType', sessionData.sessionType);
        formData.append('SessionDate', sessionData.sessionDate.toISOString());
        formData.append('Location', sessionData.location);
        formData.append('Notes', sessionData.notes || '');
        formData.append('IsElectoral', sessionData.isElectoral.toString());

        // Main documents
        if (sessionData.programs) 
            formData.append('Programs', sessionData.programs);
        if (sessionData.budget) 
            formData.append('Budget', sessionData.budget);
        if (sessionData.financialReport) 
            formData.append('FinancialReport', sessionData.financialReport);
        if (sessionData.literaryReport) 
            formData.append('LiteraryReport', sessionData.literaryReport);
        if (sessionData.auditorReport) 
            formData.append('AuditorReport', sessionData.auditorReport);
        if (sessionData.newspaperAnnouncement) 
            formData.append('NewspaperAnnouncement', sessionData.newspaperAnnouncement);

        // NULL but will be updated when the session pass from pending to the general sessions history
        if (sessionData.generalSessionPV) 
            formData.append('GeneralSessionPV', sessionData.generalSessionPV);
        if (sessionData.newspaperReport) 
            formData.append('NewspaperReport', sessionData.newspaperReport);
        if (sessionData.attendeeList) 
            formData.append('AttendeeList', sessionData.attendeeList);
        if (sessionData.membersAttendee) 
            formData.append('MembersAttendee', sessionData.membersAttendee);

        // Additional documents
        if (sessionData.additionalDocuments?.length > 0) {
            sessionData.additionalDocuments.forEach((doc, index) => {
                formData.append(`AdditionalDocuments[${index}].DocumentType`, doc.documentType);
                formData.append(`AdditionalDocuments[${index}].File`, doc.file);
            });
        }

        // Guests
        if (sessionData.guests?.length > 0) {
            sessionData.guests.forEach((guest, index) => {
                formData.append(`Guests[${index}].Name`, guest.name);
                formData.append(`Guests[${index}].Position`, guest.position);
                formData.append(`Guests[${index}].Organization`, guest.organization || '');
                formData.append(`Guests[${index}].Phone`, guest.phone);
            });
        }

        // Members
        if (sessionData.attendingMemberIds?.length > 0) {
            sessionData.attendingMemberIds.forEach(id => {
                formData.append('AttendingMemberIds', id.toString());
            });
        }

        // Candidates (for electoral sessions)
        if (sessionData.isElectoral && sessionData.candidates?.length > 0) {
            sessionData.candidates.forEach((candidate, index) => {
                formData.append(`Candidates[${index}].Name`, candidate.name);
                formData.append(`Candidates[${index}].Position`, candidate.position);
                formData.append(`Candidates[${index}].CandidateFile`, candidate.candidateFile);
            });
        }

        const response = await apiClient.post('/sessions', formData, { // ✅ Use apiClient
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            transformRequest: (data) => data, // Prevent axios from transforming FormData
        });

        return response.data;
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            stack: error.stack
        });
        throw error;
    }
};

export const getAllSessions = async () => {
    try {
        const response = await apiClient.get('/sessions'); // ✅ Use apiClient
        return response.data;
    } catch (error) {
        console.error('Error fetching sessions:', error.response?.data || error.message);
        throw error;
    }
};

export const getSessionById = async (id) => {
    try {
        const response = await apiClient.get(`/sessions/${id}`); // ✅ Use apiClient
        return response.data;
    } catch (error) {
        console.error(`Error fetching session ${id}:`, error.response?.data || error.message);
        throw error;
    }
};

export const getPendingSession = async () => {
    try {
        const response = await apiClient.get('/sessions/pending'); // ✅ Use apiClient
        
        // Handle case where response is successful but returns null
        if (!response.data) {
            return null;
        }
        
        return response.data;
    } catch (error) {
        console.error("Error fetching the pending session:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        throw error;
    }
};

export const completeSession = async (sessionId, formData) => {
    try {
      const response = await apiClient.put( // ✅ Use apiClient
        `/sessions/${sessionId}/complete`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error completing session:', error.response?.data);
      throw error;
    }
};

export const getCompletedSessions = async () => {
    try {
        const response = await apiClient.get('/sessions/completed'); // ✅ Use apiClient
        return response.data;
    } catch (error) {
        console.error("Error fetching the completed session:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        throw error;
    }
};

export const uploadDocumentProof = async (sessionId, documentType, actionType, file) => {
    try {
        const formData = new FormData();
        formData.append('documentType', documentType);
        formData.append('actionType', actionType);
        formData.append('proofFile', file);

        const response = await apiClient.post( // ✅ Use apiClient
            `/sessions/${sessionId}/documents/track`,  
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error uploading document proof:', error.response?.data || error.message);
        throw error;
    }
};

export const getDocumentStatuses = async (sessionId) => {
    try {
        const response = await apiClient.get(`/sessions/${sessionId}/documents/status`); // ✅ Use apiClient
        return response.data;
    } catch (error) {
        console.error('Error fetching document statuses:', error);
        throw error;
    }
};

export const getDocumentHistory = async (sessionId, documentType) => {
    try {
        const response = await apiClient.get(`/sessions/${sessionId}/documents/history`, { // ✅ Use apiClient
            params: { documentType }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching document history:', error);
        throw error;
    }
};

export const downloadDocument = async (sessionId, documentType) => {
  try {
    const response = await apiClient.get( // ✅ Use apiClient
      `/sessions/documents/download/${encodeURIComponent(documentType)}/${sessionId}`,
      {
        responseType: 'blob',
      }
    );

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${documentType}.${getFileExtensionFromContentType(contentType)}`);
    link.click();
    link.remove();

  } catch (error) {
    console.error('Download failed:', error.response?.data || error.message);
    throw error;
  }
};

function getFileExtensionFromContentType(type) {
  if (!type) return 'bin';
  if (type === 'application/pdf') return 'pdf';
  if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  return 'bin';
}

export const printDocument = async (sessionId, documentType, title = "Document") => {
  try {
    const response = await apiClient.get( // ✅ Use apiClient
      `/sessions/documents/download/${encodeURIComponent(documentType)}/${sessionId}`,
      {
        responseType: "blob",
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

export const downloadDocumentProof = async (trackingId) => {
  try {
    const response = await apiClient.get( // ✅ Use apiClient
      `/sessions/documents/proofs/download/${trackingId}`,
      {
        responseType: 'blob',
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from content-disposition or use trackingId
    const contentDisposition = response.headers['content-disposition'];
    let fileName = `document-proof-${trackingId}`;
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch?.[1]) fileName = fileNameMatch[1];
    }

    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Download failed:', error);
    throw new Error(error.response?.data?.message || 'Failed to download document');
  }
};

export const printDocumentProof = async (trackingId, title = "Document Proof") => {
  try {
    const response = await apiClient.get( // ✅ Use apiClient
      `/sessions/documents/proofs/download/${trackingId}?forPrint=true`,
      {
        responseType: 'blob',
      }
    );

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
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
          <iframe src="${blobUrl}"></iframe>
          <script>
            window.onload = function() {
              setTimeout(function() {
                document.querySelector('iframe').contentWindow.focus();
                document.querySelector('iframe').contentWindow.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (error) {
    console.error("Error printing document proof:", error);
    throw new Error(error.response?.data?.message || 'Failed to print document');
  }
};