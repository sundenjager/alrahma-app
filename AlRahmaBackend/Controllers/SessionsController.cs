using Microsoft.AspNetCore.Mvc;
using AlRahmaBackend.DTOs;
using AlRahmaBackend.Services;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using AlRahmaBackend.Data;
using Microsoft.AspNetCore.Hosting;

namespace AlRahmaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Require authentication for all endpoints by default
    public class SessionsController : ControllerBase
    {
        private readonly ISessionService _sessionService;
        private readonly ILogger<SessionsController> _logger;
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public SessionsController(
            ISessionService sessionService,
            ILogger<SessionsController> logger,
            ApplicationDbContext context,
            IWebHostEnvironment environment)
        {
            _sessionService = sessionService;
            _logger = logger;
            _context = context;
            _environment = environment;
        }

        [HttpPost]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can create sessions
        public async Task<ActionResult<SessionResponseDTO>> CreateSession([FromForm] CreateSessionDTO dto)
        {
            try
            {
                _logger.LogInformation("Starting session creation for {SessionType} on {SessionDate} by user {UserId}",
                    dto.SessionType, dto.SessionDate, User.Identity?.Name);

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for session creation by user {UserId}", User.Identity?.Name);
                    return BadRequest(new { Errors = ModelState });
                }

                // Additional validation
                if (dto.SessionDate < DateTime.UtcNow.Date)
                {
                    return BadRequest(new { Error = "Session date cannot be in the past" });
                }

                var result = await _sessionService.CreateSessionAsync(dto);

                _logger.LogInformation("Successfully created session with ID: {SessionId}, Type: {SessionType}, Date: {SessionDate} by user {UserId}",
                    result.Id, dto.SessionType, dto.SessionDate, User.Identity?.Name);
                
                return CreatedAtAction(nameof(GetSession), new { id = result.Id }, result);
            }
            catch (ValidationException ex)
            {
                _logger.LogWarning("Validation error creating session by user {UserId}: {ErrorMessage}", 
                    User.Identity?.Name, ex.Message);
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex) when (ex is FileUploadException || ex is DatabaseOperationException)
            {
                _logger.LogError(ex, "Error creating session by user {UserId}: {ErrorType}", 
                    User.Identity?.Name, ex.GetType().Name);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { Error = "An error occurred while processing the session" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating session by user {UserId}", User.Identity?.Name);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { Error = "An unexpected error occurred" });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<SessionResponseDTO>> GetSession(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid session ID" });
                }

                _logger.LogInformation("Fetching session with ID: {SessionId} by user {UserId}", id, User.Identity?.Name);

                var session = await _sessionService.GetSessionByIdAsync(id);
                if (session == null)
                {
                    _logger.LogWarning("Session with ID {SessionId} not found, requested by user {UserId}", id, User.Identity?.Name);
                    return NotFound(new { Error = "Session not found" });
                }

                return Ok(session);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching session with ID {SessionId} by user {UserId}", id, User.Identity?.Name);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { Error = "Error retrieving session" });
            }
        }

        [HttpGet]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<List<SessionResponseDTO>>> GetAllSessions()
        {
            try
            {
                _logger.LogInformation("Fetching all sessions by user {UserId}", User.Identity?.Name);
                var sessions = await _sessionService.GetAllSessionsAsync();
                return Ok(sessions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching sessions by user {UserId}", User.Identity?.Name);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { Error = "Error retrieving sessions" });
            }
        }

        [HttpGet("pending")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<SessionResponseDTO>> GetPendingSession()
        {
            try
            {
                _logger.LogInformation("Fetching pending session by user {UserId}", User.Identity?.Name);

                var session = await _sessionService.GetPendingSessionAsync();

                if (session == null)
                {
                    _logger.LogInformation("No pending session exists, requested by user {UserId}", User.Identity?.Name);
                    return Ok(new { Message = "No pending session exists" });
                }

                return Ok(session);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetPendingSession by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new
                {
                    Error = "Internal server error"
                });
            }
        }

        [HttpPut("{id}/complete")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can complete sessions
        public async Task<ActionResult<SessionResponseDTO>> CompleteSession(int id, [FromForm] CompleteSessionDTO dto)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid session ID" });
                }

                _logger.LogInformation("Completing session with ID: {SessionId} by user {UserId}", id, User.Identity?.Name);
                
                var result = await _sessionService.CompleteSessionAsync(id, dto);
                
                _logger.LogInformation("Session completed with ID: {SessionId} by user {UserId}", id, User.Identity?.Name);
                
                return Ok(result);
            }
            catch (ValidationException ex)
            {
                _logger.LogWarning("Validation error completing session by user {UserId}: {ErrorMessage}", 
                    User.Identity?.Name, ex.Message);
                return BadRequest(new { Error = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning("Session not found for completion by user {UserId}: {SessionId}", 
                    User.Identity?.Name, id);
                return NotFound(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing session with ID: {SessionId} by user {UserId}", id, User.Identity?.Name);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { Error = "An error occurred while completing the session" });
            }
        }

        [HttpGet("completed")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<List<SessionResponseDTO>>> GetCompletedSessions()
        {
            try
            {
                _logger.LogInformation("Fetching completed sessions by user {UserId}", User.Identity?.Name);
                var sessions = await _sessionService.GetCompletedSessionsAsync();
                return Ok(sessions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching completed sessions by user {UserId}", User.Identity?.Name);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { Error = "Error retrieving completed sessions" });
            }
        }

        [HttpGet("{sessionId}/documents/history")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read document history
        public async Task<IActionResult> GetDocumentHistory(int sessionId, [FromQuery] string documentType)
        {
            try
            {
                if (sessionId <= 0)
                {
                    return BadRequest(new { Error = "Invalid session ID" });
                }

                if (string.IsNullOrWhiteSpace(documentType))
                {
                    return BadRequest(new { Error = "Document type is required" });
                }

                var history = await _sessionService.GetDocumentHistoryAsync(sessionId, documentType);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving document history for session {SessionId} by user {UserId}", 
                    sessionId, User.Identity?.Name);
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("{sessionId}/documents/status")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read document statuses
        public async Task<IActionResult> GetDocumentStatuses(int sessionId)
        {
            try
            {
                if (sessionId <= 0)
                {
                    return BadRequest(new { Error = "Invalid session ID" });
                }

                var statuses = await _sessionService.GetDocumentStatusesAsync(sessionId);
                return Ok(statuses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving document statuses for session {SessionId} by user {UserId}", 
                    sessionId, User.Identity?.Name);
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("documents/download/{documentType}/{sessionId}")]
        [Authorize(Policy = "RequireUserRole")] // Authenticated users can download documents
        public IActionResult DownloadDocument(string documentType, int sessionId)
        {
            try
            {
                if (sessionId <= 0)
                {
                    return BadRequest(new { Error = "Invalid session ID" });
                }

                if (string.IsNullOrWhiteSpace(documentType))
                {
                    return BadRequest(new { Error = "Document type is required" });
                }

                // Get the file path based on documentType and sessionId
                string filePath = _sessionService.GetDocumentPath(sessionId, documentType);

                if (string.IsNullOrEmpty(filePath) || !System.IO.File.Exists(filePath))
                {
                    return NotFound(new { Error = "Document not found" });
                }

                // Determine content type
                string contentType = GetContentType(filePath);

                _logger.LogInformation("Document downloaded: {DocumentType} for session {SessionId} by user {UserId}", 
                    documentType, sessionId, User.Identity?.Name);

                // Return the physical file
                var fileBytes = System.IO.File.ReadAllBytes(filePath);
                return File(fileBytes, contentType, Path.GetFileName(filePath));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading document {DocumentType} for session {SessionId} by user {UserId}", 
                    documentType, sessionId, User.Identity?.Name);
                return StatusCode(500, new { Error = "Error downloading document" });
            }
        }

        [HttpPost("{sessionId}/documents/track")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can track documents
        public async Task<IActionResult> TrackDocument(
            int sessionId,
            [FromForm] string documentType,
            [FromForm] string actionType,
            [FromForm] IFormFile proofFile)
        {
            try
            {
                if (sessionId <= 0)
                {
                    return BadRequest(new { Error = "Invalid session ID" });
                }

                if (string.IsNullOrWhiteSpace(documentType))
                {
                    return BadRequest(new { Error = "Document type is required" });
                }

                if (string.IsNullOrWhiteSpace(actionType))
                {
                    return BadRequest(new { Error = "Action type is required" });
                }

                if (proofFile == null || proofFile.Length == 0)
                {
                    return BadRequest(new { Error = "No file uploaded" });
                }

                // Validate file type
                var validExtensions = new[] { ".pdf", ".docx", ".jpg", ".png" };
                var extension = Path.GetExtension(proofFile.FileName).ToLowerInvariant();
                if (!validExtensions.Contains(extension))
                {
                    return BadRequest(new { Error = "Invalid file type. Allowed types: PDF, DOCX, JPG, PNG" });
                }

                // Validate file size (10MB max)
                if (proofFile.Length > 10 * 1024 * 1024)
                {
                    return BadRequest(new { Error = "File size cannot exceed 10MB" });
                }

                var filePath = await _sessionService.TrackDocumentAsync(
                    sessionId, documentType, actionType, proofFile);

                _logger.LogInformation("Document tracked: {DocumentType} for session {SessionId} by user {UserId}", 
                    documentType, sessionId, User.Identity?.Name);

                return Ok(new
                {
                    filePath,
                    fullUrl = Url.Action(
                        action: "DownloadDocument",
                        controller: "Sessions",
                        values: new
                        {
                            documentType = documentType,
                            sessionId = sessionId
                        },
                        protocol: Request.Scheme
                    )
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error tracking document for session {SessionId} by user {UserId}", 
                    sessionId, User.Identity?.Name);
                return BadRequest(new { Error = ex.Message });
            }
        }
        
        [HttpGet("documents/proofs/download/{trackingId}")]
        [Authorize(Policy = "RequireUserRole")] // Authenticated users can download document proofs
        public async Task<IActionResult> DownloadDocumentProof(int trackingId, [FromQuery] bool forPrint = false)
        {
            try
            {
                if (trackingId <= 0)
                {
                    return BadRequest(new { Error = "Invalid tracking ID" });
                }

                var tracking = await _context.DocumentTrackings.FindAsync(trackingId);
                if (tracking == null || string.IsNullOrEmpty(tracking.ProofFilePath))
                    return NotFound(new { Error = "Document proof not found" });

                var filePath = Path.Combine(_environment.WebRootPath, 
                                        tracking.ProofFilePath.TrimStart('/'));
                
                if (!System.IO.File.Exists(filePath))
                    return NotFound(new { Error = "File not found on server" });

                var contentType = GetContentType(filePath);
                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                
                _logger.LogInformation("Document proof downloaded for tracking ID {TrackingId} by user {UserId}", 
                    trackingId, User.Identity?.Name);

                // For printing, return as inline content
                if (forPrint)
                {
                    Response.Headers.Add("Content-Disposition", "inline");
                    return File(fileBytes, contentType);
                }
                
                // For download, return with attachment header
                return File(fileBytes, contentType, Path.GetFileName(filePath));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error accessing document proof for tracking ID {TrackingId} by user {UserId}", 
                    trackingId, User.Identity?.Name);
                return StatusCode(500, new { Error = "Error accessing document" });
            }
        }

        [HttpGet("documents/proofs/print/{trackingId}")]
        [Authorize(Policy = "RequireUserRole")] // Authenticated users can print document proofs
        public async Task<IActionResult> PrintDocumentProof(int trackingId)
        {
            try
            {
                if (trackingId <= 0)
                {
                    return BadRequest(new { Error = "Invalid tracking ID" });
                }

                string filePath = await _sessionService.GetDocumentProofPath(trackingId);
                
                if (string.IsNullOrEmpty(filePath) || !System.IO.File.Exists(filePath))
                {
                    return NotFound(new { Error = "Document proof not found" });
                }

                // For printing, we'll return the file with inline content disposition
                string contentType = GetContentType(filePath);
                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                
                _logger.LogInformation("Document proof printed for tracking ID {TrackingId} by user {UserId}", 
                    trackingId, User.Identity?.Name);

                Response.Headers.Add("Content-Disposition", "inline");
                return File(fileBytes, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error preparing document proof for printing for tracking ID {TrackingId} by user {UserId}", 
                    trackingId, User.Identity?.Name);
                return StatusCode(500, new { Error = "Error preparing document for printing" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireSuperAdminRole")] // Only SuperAdmin can delete sessions
        public async Task<IActionResult> DeleteSession(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid session ID" });
                }

                await _sessionService.DeleteSessionAsync(id);
                
                _logger.LogInformation("Session deleted with ID: {SessionId} by user {UserId}", 
                    id, User.Identity?.Name);

                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning("Session not found for deletion by user {UserId}: {SessionId}", 
                    User.Identity?.Name, id);
                return NotFound(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting session with ID: {SessionId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while deleting the session" });
            }
        }

        private string GetContentType(string path)
        {
            var extension = Path.GetExtension(path).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                _ => "application/octet-stream"
            };
        }
    }

    // Custom exceptions for better error handling
    public class ValidationException : Exception
    {
        public ValidationException(string message) : base(message) { }
    }

    public class FileUploadException : Exception
    {
        public FileUploadException(string message, Exception innerException) 
            : base(message, innerException) { }
    }

    public class DatabaseOperationException : Exception
    {
        public DatabaseOperationException(string message, Exception innerException) 
            : base(message, innerException) { }
    }
}