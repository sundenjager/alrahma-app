    using AlRahmaBackend.Data;
    using AlRahmaBackend.DTOs;
    using AlRahmaBackend.Models;
    using Microsoft.EntityFrameworkCore;

    namespace AlRahmaBackend.Services
    {
    public class SessionService : ISessionService
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<SessionService> _logger;

        public SessionService(
            ApplicationDbContext context,
            IWebHostEnvironment environment,
            ILogger<SessionService> logger)
        {
            _context = context;
            _environment = environment;
            _logger = logger;
        }

        public async Task<SessionResponseDTO> CreateSessionAsync(CreateSessionDTO dto)
        {
            // Use the execution strategy to handle transactions
            var executionStrategy = _context.Database.CreateExecutionStrategy();

            return await executionStrategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    _logger.LogInformation("Starting session creation process");

                    // Check if a session with status "Pending" already exists
                    var existingPendingSession = await _context.Sessions
                    .AsNoTracking()
                    .AnyAsync(s => s.Status == "Pending");
                    if (existingPendingSession)
                    {
                        throw new ValidationException("Cannot create a new session. A session with status 'Pending' already exists.");
                    }

                    // Validate required documents for non-electoral sessions
                    if (!dto.IsElectoral)
                    {
                        ValidateRequiredDocuments(dto);
                    }

                    var session = new Session
                    {
                        SessionType = dto.SessionType,
                        SessionDate = dto.SessionDate,
                        Location = dto.Location,
                        Notes = dto.Notes,
                        IsElectoral = dto.IsElectoral,
                        Status = "Pending",
                        CreatedAt = DateTime.UtcNow
                    };

                    // Process and save all document types
                    await ProcessSessionDocumentsAsync(session, dto);

                    // Process guests
                    session.Guests = ProcessGuests(dto.Guests);

                    // Process candidates (only for electoral sessions)
                    if (dto.IsElectoral)
                    {
                        session.Candidates = await ProcessCandidatesAsync(dto.Candidates);
                    }

                    // Process additional documents
                    session.Documents = await ProcessAdditionalDocumentsAsync(dto.AdditionalDocuments);

                    _context.Sessions.Add(session);
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();

                    _logger.LogInformation($"Successfully created session with ID: {session.Id}");
                    return await GetSessionByIdAsync(session.Id);
                }
                catch (ValidationException ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogWarning($"Validation error creating session: {ex.Message}");
                    throw;
                }
                catch (DbUpdateException ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError($"Database error creating session: {ex.InnerException?.Message ?? ex.Message}");
                    throw new Exception("Failed to save session to database", ex);
                }
                catch (IOException ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError($"File system error creating session: {ex.Message}");
                    throw new Exception("Failed to save session documents", ex);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError($"Unexpected error creating session: {ex.Message}");
                    throw;
                }
            });
        }

        private void ValidateRequiredDocuments(CreateSessionDTO dto)
        {
            var missingDocuments = new List<string>();

            // Only validate these specific documents for extraordinary sessions
            if (dto.SessionType == "Extraordinary")
            {
                // ✅ Check only required documents
                if (dto.Programs == null) missingDocuments.Add("Programs");
                if (dto.Budget == null) missingDocuments.Add("Budget");
                if (dto.FinancialReport == null) missingDocuments.Add("FinancialReport");
                if (dto.LiteraryReport == null) missingDocuments.Add("LiteraryReport");
                if (dto.AuditorReport == null) missingDocuments.Add("AuditorReport");
                if (dto.NewspaperAnnouncement == null) missingDocuments.Add("NewspaperAnnouncement");
            }
            
            if (missingDocuments.Any())
            {
                throw new ValidationException(
                    $"Missing required documents: {string.Join(", ", missingDocuments)}");
            }
        }

        private async Task ProcessSessionDocumentsAsync(Session session, CreateSessionDTO dto)
        {
            var documentTasks = new List<Task>();

            // Existing documents
            if (dto.Programs != null)
                documentTasks.Add(SaveDocumentAsync(dto.Programs, "programs").ContinueWith(t =>
                    session.ProgramsFilePath = t.Result));

            if (dto.Budget != null)
                documentTasks.Add(SaveDocumentAsync(dto.Budget, "budget").ContinueWith(t =>
                    session.BudgetFilePath = t.Result));

            if (dto.FinancialReport != null)
                documentTasks.Add(SaveDocumentAsync(dto.FinancialReport, "financial-reports").ContinueWith(t =>
                    session.FinancialReportFilePath = t.Result));

            if (dto.LiteraryReport != null)
                documentTasks.Add(SaveDocumentAsync(dto.LiteraryReport, "literary-reports").ContinueWith(t =>
                    session.LiteraryReportFilePath = t.Result));

            if (dto.AuditorReport != null)
                documentTasks.Add(SaveDocumentAsync(dto.AuditorReport, "auditor-reports").ContinueWith(t =>
                    session.AuditorReportFilePath = t.Result));

            if (dto.NewspaperAnnouncement != null)
                documentTasks.Add(SaveDocumentAsync(dto.NewspaperAnnouncement, "newspaper-announcements").ContinueWith(t =>
                    session.NewspaperAnnouncementFilePath = t.Result));

            // nullable documents
            if (dto.GeneralSessionPV != null)
                documentTasks.Add(SaveDocumentAsync(dto.GeneralSessionPV, "general-session-pv").ContinueWith(t =>
                    session.GeneralSessionPVFilePath = t.Result));

            if (dto.NewspaperReport != null)
                documentTasks.Add(SaveDocumentAsync(dto.NewspaperReport, "newspaper-reports").ContinueWith(t =>
                    session.NewspaperReportFilePath = t.Result));

            if (dto.AttendeeList != null)
                documentTasks.Add(SaveDocumentAsync(dto.AttendeeList, "attendee-lists").ContinueWith(t =>
                    session.AttendeeListFilePath = t.Result));

            if (dto.MembersAttendee != null)
                documentTasks.Add(SaveDocumentAsync(dto.MembersAttendee, "members-attendee").ContinueWith(t =>
                    session.MembersAttendeeFilePath = t.Result));

            await Task.WhenAll(documentTasks);
        }

        private List<SessionGuest> ProcessGuests(List<SessionGuestDTO> guests)
        {
            return guests?.Select(g => new SessionGuest
            {
                Name = g.Name,
                Position = g.Position,
                Organization = g.Organization ?? string.Empty,
                Phone = g.Phone,
                CreatedAt = DateTime.UtcNow
            }).ToList() ?? new List<SessionGuest>();
        }

        /*private List<SessionMember> ProcessMembers(List<int> informedIds, List<int> attendingIds)
        {
            var allIds = (informedIds ?? new List<int>()).Union(attendingIds ?? new List<int>()).Distinct();
            return allIds.Select(id => new SessionMember
            {
                MemberId = id,
                IsInformed = informedIds?.Contains(id) ?? false,
                IsPresent = attendingIds?.Contains(id) ?? false,
                CreatedAt = DateTime.UtcNow
            }).ToList();
        }*/

        private async Task<List<SessionCandidate>> ProcessCandidatesAsync(List<SessionCandidateDTO> candidates)
        {
            var result = new List<SessionCandidate>();

            foreach (var candidate in candidates ?? new List<SessionCandidateDTO>())
            {
                if (candidate.CandidateFile != null)
                {
                    var filePath = await SaveFileAsync(candidate.CandidateFile, "candidates");
                    result.Add(new SessionCandidate
                    {
                        Name = candidate.Name,
                        Position = candidate.Position,
                        CandidateFilePath = filePath,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            return result;
        }

        private async Task<List<SessionDocument>> ProcessAdditionalDocumentsAsync(List<SessionDocumentDTO> documents)
        {
            var result = new List<SessionDocument>();

            foreach (var doc in documents ?? new List<SessionDocumentDTO>())
            {
                if (doc.File != null)
                {
                    var filePath = await SaveFileAsync(doc.File, "additional-documents");
                    result.Add(new SessionDocument
                    {
                        DocumentType = doc.DocumentType,
                        FilePath = filePath,
                        UploadedAt = DateTime.UtcNow
                    });
                }
            }

            return result;
        }

        private async Task<string> SaveDocumentAsync(IFormFile file, string subFolder)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Document file is empty");

            return await SaveFileAsync(file, subFolder);
        }

        public async Task<string> SaveFileAsync(IFormFile file, string folder)
        {
            if (file == null) return null;

            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", folder);
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return consistent path format
            return $"/uploads/{folder}/{uniqueFileName}";
        }

        public async Task<List<SessionResponseDTO>> GetAllSessionsAsync()
        {
            return await _context.Sessions
                .Include(s => s.Documents)
                .Include(s => s.Guests)
                //.Include(s => s.Members)
                //.ThenInclude(m => m.Member)
                .Include(s => s.Candidates)
                .OrderByDescending(s => s.SessionDate)
                .Select(s => MapToResponseDTO(s))
                .ToListAsync();
        }

        public async Task<SessionResponseDTO> GetSessionByIdAsync(int id)
        {
            var session = await _context.Sessions
                .Include(s => s.Documents)
                .Include(s => s.Guests)
                //.Include(s => s.Members)
                //.ThenInclude(m => m.Member)
                .Include(s => s.Candidates)
                .FirstOrDefaultAsync(s => s.Id == id);

            return session == null ? null : MapToResponseDTO(session);
        }

        private SessionResponseDTO MapToResponseDTO(Session session)
        {
            return new SessionResponseDTO
            {
                Id = session.Id,
                SessionType = session.SessionType,
                SessionDate = session.SessionDate,
                Location = session.Location,
                Notes = session.Notes,
                Status = session.Status,
                IsElectoral = session.IsElectoral,
                ProgramsFilePath = session.ProgramsFilePath,
                BudgetFilePath = session.BudgetFilePath,
                FinancialReportFilePath = session.FinancialReportFilePath,
                LiteraryReportFilePath = session.LiteraryReportFilePath,
                AuditorReportFilePath = session.AuditorReportFilePath,
                NewspaperAnnouncementFilePath = session.NewspaperAnnouncementFilePath,
                GeneralSessionPVFilePath = session.GeneralSessionPVFilePath,
                NewspaperReportFilePath = session.NewspaperReportFilePath,
                AttendeeListFilePath = session.AttendeeListFilePath,
                MembersAttendeeFilePath = session.MembersAttendeeFilePath,
                CreatedAt = session.CreatedAt,
                UpdatedAt = session.UpdatedAt,
                Guests = session.Guests.Select(g => new SessionGuestResponseDTO
                {
                    Id = g.Id,
                    Name = g.Name,
                    Position = g.Position,
                    Organization = g.Organization,
                    Phone = g.Phone,
                    CreatedAt = g.CreatedAt
                }).ToList(),
                /*Members = session.Members.Select(m => new SessionMemberResponseDTO
                {
                    Id = m.Id,
                    MemberId = m.MemberId,
                    Name = m.Member?.Name,
                    LastName = m.Member?.Lastname,
                    Phone = m.Member?.Tel,
                    IsInformed = m.IsInformed,
                    IsPresent = m.IsPresent,
                    CreatedAt = m.CreatedAt
                }).ToList(),*/
                Candidates = session.Candidates.Select(c => new SessionCandidateResponseDTO
                {
                    Id = c.Id,
                    Name = c.Name,
                    Position = c.Position,
                    CandidateFilePath = c.CandidateFilePath,
                    CreatedAt = c.CreatedAt
                }).ToList(),
                AdditionalDocuments = session.Documents.Select(d => new SessionDocumentResponseDTO
                {
                    Id = d.Id,
                    DocumentType = d.DocumentType,
                    FilePath = d.FilePath,
                    UploadedAt = d.UploadedAt
                }).ToList()
            };
        }

        public async Task<SessionResponseDTO> GetPendingSessionAsync()
        {
            try
            {
                // Remove the AsNoTracking() to allow tracking changes if needed
                var session = await _context.Sessions
                    .Include(s => s.Documents)
                    .Include(s => s.Guests)
                    .Include(s => s.Candidates)
                    .FirstOrDefaultAsync(s => s.Status == "Pending");

                if (session == null)
                {
                    _logger.LogWarning("No pending session found in database");
                    return null;
                }

                return MapToResponseDTO(session);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching pending session");
                throw;
            }
        }



        // Add to SessionService class
        public async Task<SessionResponseDTO> CompleteSessionAsync(int sessionId, CompleteSessionDTO dto)
        {
            var executionStrategy = _context.Database.CreateExecutionStrategy();

            if (dto.GeneralSessionPV != null && dto.GeneralSessionPV.Length == 0)
            {
                throw new ValidationException("General Session PV file is empty");
            }

            return await executionStrategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    _logger.LogInformation("Starting session completion process for session ID: {SessionId}", sessionId);

                    var session = await _context.Sessions
                        .FirstOrDefaultAsync(s => s.Id == sessionId && s.Status == "Pending");

                    if (session == null)
                    {
                        throw new ValidationException("No pending session found with the specified ID");
                    }

                    // Update session status
                    session.Status = "Completed";
                    session.UpdatedAt = DateTime.UtcNow;

                    // Process and save the completion documents
                    if (dto.GeneralSessionPV != null)
                    {
                        session.GeneralSessionPVFilePath = await SaveDocumentAsync(dto.GeneralSessionPV, "general-session-pv");
                    }

                    if (dto.NewspaperReport != null)
                    {
                        session.NewspaperReportFilePath = await SaveDocumentAsync(dto.NewspaperReport, "newspaper-reports");
                    }

                    if (dto.AttendeeList != null)
                    {
                        session.AttendeeListFilePath = await SaveDocumentAsync(dto.AttendeeList, "attendee-lists");
                    }

                    if (dto.MembersAttendee != null)
                    {
                        session.MembersAttendeeFilePath = await SaveDocumentAsync(dto.MembersAttendee, "members-attendee");
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation("Successfully completed session with ID: {SessionId}", sessionId);
                    return await GetSessionByIdAsync(sessionId);
                }
                catch (ValidationException ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogWarning("Validation error completing session: {ErrorMessage}", ex.Message);
                    throw;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error completing session with ID: {SessionId}", sessionId);
                    throw new Exception("Failed to complete session", ex);
                }
            });
        }

        public async Task<List<SessionResponseDTO>> GetCompletedSessionsAsync()
        {
            try
            {
                _logger.LogInformation("Querying completed sessions from the database");
                var sessions = await _context.Sessions
                    .Include(s => s.Documents)
                    .Include(s => s.Guests)
                    .Include(s => s.Candidates)
                    .Where(s => s.Status == "Completed")
                    .OrderByDescending(s => s.SessionDate)
                    .ToListAsync();

                if (!sessions.Any())
                {
                    _logger.LogWarning("No completed sessions found");
                }

                return sessions.Select(MapToResponseDTO).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching completed sessions");
                throw;
            }
        }



        public async Task<string> TrackDocumentAsync(int sessionId, string documentType, string actionType, IFormFile proofFile)
        {
            var session = await _context.Sessions.FindAsync(sessionId);
            if (session == null)
            {
                throw new ArgumentException("Session not found");
            }

            // Save the proof file
            var folder = "document-proofs";
            var filePath = await SaveFileAsync(proofFile, folder);

            var tracking = new DocumentTracking
            {
                SessionId = sessionId,
                DocumentType = documentType,
                ActionType = actionType,
                ProofFilePath = filePath,
            };

            _context.DocumentTrackings.Add(tracking);
            await _context.SaveChangesAsync();

            return filePath;
        }

        public async Task<List<DocumentTrackingDTO>> GetDocumentHistoryAsync(int sessionId, string documentType)
        {
            return await _context.DocumentTrackings
                .Where(t => t.SessionId == sessionId && t.DocumentType == documentType)
                .OrderByDescending(t => t.ActionDate)
                .Select(t => new DocumentTrackingDTO
                {
                    Id = t.Id,
                    SessionId = t.SessionId,
                    DocumentType = t.DocumentType,
                    ActionType = t.ActionType,
                    ProofFilePath = t.ProofFilePath,
                    ActionDate = t.ActionDate
                    // Removed: AdminName
                })
                .ToListAsync();
        }

        public async Task<List<DocumentStatusDTO>> GetDocumentStatusesAsync(int sessionId)
        {
            var documentTypes = new[] { "governmentPresidency", "financialRegistry", "bankDocuments", "rneDocuments", "delegationDocuments" };

            var statuses = new List<DocumentStatusDTO>();

            foreach (var docType in documentTypes)
            {
                var sent = await _context.DocumentTrackings
                    .AnyAsync(t => t.SessionId == sessionId &&
                                t.DocumentType == docType &&
                                t.ActionType == "send");

                var received = await _context.DocumentTrackings
                    .AnyAsync(t => t.SessionId == sessionId &&
                                t.DocumentType == docType &&
                                t.ActionType == "receive");

                var sentRecord = await _context.DocumentTrackings
                    .Where(t => t.SessionId == sessionId &&
                            t.DocumentType == docType &&
                            t.ActionType == "send")
                    .OrderByDescending(t => t.ActionDate)
                    .FirstOrDefaultAsync();

                var receivedRecord = await _context.DocumentTrackings
                    .Where(t => t.SessionId == sessionId &&
                            t.DocumentType == docType &&
                            t.ActionType == "receive")
                    .OrderByDescending(t => t.ActionDate)
                    .FirstOrDefaultAsync();

                statuses.Add(new DocumentStatusDTO
                {
                    DocumentType = docType,
                    IsSent = sent,
                    IsReceived = received,
                    SentDate = sentRecord?.ActionDate,
                    ReceivedDate = receivedRecord?.ActionDate,
                    SentProof = sentRecord?.ProofFilePath,
                    ReceivedProof = receivedRecord?.ProofFilePath
                });
            }

            return statuses;
        }

        public string GetDocumentPath(int sessionId, string documentType)
        {
            var session = _context.Sessions.Find(sessionId);
            if (session == null) return null;

            string relativePath = documentType.ToLower() switch
            {
                "programs" => session.ProgramsFilePath,
                "budget" => session.BudgetFilePath,
                "financialreport" => session.FinancialReportFilePath,
                "literaryreport" => session.LiteraryReportFilePath,
                "auditorreport" => session.AuditorReportFilePath,
                "newspaperannouncement" => session.NewspaperAnnouncementFilePath,
                "generalsessionpv" => session.GeneralSessionPVFilePath,
                "newspaperreport" => session.NewspaperReportFilePath,
                "attendeelist" => session.AttendeeListFilePath,
                "membersattendee" => session.MembersAttendeeFilePath,
                _ => null
            };


            if (string.IsNullOrEmpty(relativePath)) return null;

            // Remove leading slash if present
            if (relativePath.StartsWith("/"))
            {
                relativePath = relativePath.Substring(1);
            }

            return Path.Combine(_environment.WebRootPath, relativePath);
        }

        public bool ValidateDocument(int sessionId, string documentType)
        {
            var path = GetDocumentPath(sessionId, documentType);
            return !string.IsNullOrEmpty(path) && System.IO.File.Exists(path);
        }

        public async Task<string> GetDocumentProofPath(int trackingId)
        {
            var tracking = await _context.DocumentTrackings.FindAsync(trackingId);
            if (tracking == null) return null;

            // Remove leading slash if present
            var relativePath = tracking.ProofFilePath.StartsWith("/")
                ? tracking.ProofFilePath.Substring(1)
                : tracking.ProofFilePath;

            return Path.Combine(_environment.WebRootPath, relativePath);
        }

        public bool ValidateDocumentProof(int trackingId)
        {
            var path = GetDocumentProofPath(trackingId).Result;
            return !string.IsNullOrEmpty(path) && System.IO.File.Exists(path);
        }
        
        public async Task DeleteSessionAsync(int id)
        {
            var executionStrategy = _context.Database.CreateExecutionStrategy();

            await executionStrategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    _logger.LogInformation("Starting session deletion process for session ID: {SessionId}", id);

                    var session = await _context.Sessions
                        .Include(s => s.Documents)
                        .Include(s => s.Guests)
                        .Include(s => s.Candidates)
                        .Include(s => s.DocumentTrackings) // Include document tracking records
                        .FirstOrDefaultAsync(s => s.Id == id);

                    if (session == null)
                    {
                        throw new ValidationException("Session not found");
                    }

                    // Delete associated files from the file system
                    await DeleteSessionFilesAsync(session);

                    // Remove all related entities - handle null collections
                    if (session.DocumentTrackings != null)
                    {
                        _context.DocumentTrackings.RemoveRange(session.DocumentTrackings);
                    }
                    
                    if (session.Documents != null)
                    {
                        _context.SessionDocuments.RemoveRange(session.Documents);
                    }
                    
                    if (session.Guests != null)
                    {
                        _context.SessionGuests.RemoveRange(session.Guests);
                    }
                    
                    if (session.Candidates != null)
                    {
                        _context.SessionCandidates.RemoveRange(session.Candidates);
                    }

                    // Remove the session itself
                    _context.Sessions.Remove(session);

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation("Successfully deleted session with ID: {SessionId}", id);
                }
                catch (ValidationException ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogWarning("Validation error deleting session: {ErrorMessage}", ex.Message);
                    throw;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error deleting session with ID: {SessionId}", id);
                    throw new Exception("Failed to delete session", ex);
                }
            });
        }

        private async Task DeleteSessionFilesAsync(Session session)
        {
            var filesToDelete = new List<string>();

            // Add all file paths to the deletion list
            if (!string.IsNullOrEmpty(session.ProgramsFilePath))
                filesToDelete.Add(GetFullPath(session.ProgramsFilePath));
            if (!string.IsNullOrEmpty(session.BudgetFilePath))
                filesToDelete.Add(GetFullPath(session.BudgetFilePath));
            if (!string.IsNullOrEmpty(session.FinancialReportFilePath))
                filesToDelete.Add(GetFullPath(session.FinancialReportFilePath));
            if (!string.IsNullOrEmpty(session.LiteraryReportFilePath))
                filesToDelete.Add(GetFullPath(session.LiteraryReportFilePath));
            if (!string.IsNullOrEmpty(session.AuditorReportFilePath))
                filesToDelete.Add(GetFullPath(session.AuditorReportFilePath));
            if (!string.IsNullOrEmpty(session.NewspaperAnnouncementFilePath))
                filesToDelete.Add(GetFullPath(session.NewspaperAnnouncementFilePath));
            if (!string.IsNullOrEmpty(session.GeneralSessionPVFilePath))
                filesToDelete.Add(GetFullPath(session.GeneralSessionPVFilePath));
            if (!string.IsNullOrEmpty(session.NewspaperReportFilePath))
                filesToDelete.Add(GetFullPath(session.NewspaperReportFilePath));
            if (!string.IsNullOrEmpty(session.AttendeeListFilePath))
                filesToDelete.Add(GetFullPath(session.AttendeeListFilePath));
            if (!string.IsNullOrEmpty(session.MembersAttendeeFilePath))
                filesToDelete.Add(GetFullPath(session.MembersAttendeeFilePath));

            // Add document tracking proof files - handle null collection
            if (session.DocumentTrackings != null)
            {
                foreach (var tracking in session.DocumentTrackings)
                {
                    if (!string.IsNullOrEmpty(tracking.ProofFilePath))
                        filesToDelete.Add(GetFullPath(tracking.ProofFilePath));
                }
            }

            // Add candidate files - handle null collection
            if (session.Candidates != null)
            {
                foreach (var candidate in session.Candidates)
                {
                    if (!string.IsNullOrEmpty(candidate.CandidateFilePath))
                        filesToDelete.Add(GetFullPath(candidate.CandidateFilePath));
                }
            }

            // Add additional document files - handle null collection
            if (session.Documents != null)
            {
                foreach (var document in session.Documents)
                {
                    if (!string.IsNullOrEmpty(document.FilePath))
                        filesToDelete.Add(GetFullPath(document.FilePath));
                }
            }

            // Delete files asynchronously
            var deleteTasks = filesToDelete
                .Where(File.Exists)
                .Select(filePath => Task.Run(() =>
                {
                    try
                    {
                        File.Delete(filePath);
                        _logger.LogInformation("Deleted file: {FilePath}", filePath);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete file: {FilePath}", filePath);
                    }
                }));

            await Task.WhenAll(deleteTasks);
        }

        private string GetFullPath(string relativePath)
        {
            // Remove leading slash if present
            if (relativePath.StartsWith("/"))
            {
                relativePath = relativePath.Substring(1);
            }
            
            return Path.Combine(_environment.WebRootPath, relativePath);
        }

    }

        public class ValidationException : Exception
        {
            public ValidationException(string message) : base(message) { }
        }
    }