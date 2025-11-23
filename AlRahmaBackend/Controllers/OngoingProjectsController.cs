using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AlRahmaBackend.DTOs;
using AlRahmaBackend.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace AlRahmaBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OngoingProjectsController : ControllerBase
    {
        private readonly OngoingProjectService _projectService;
        private readonly ILogger<OngoingProjectsController> _logger;

        public OngoingProjectsController(OngoingProjectService projectService, ILogger<OngoingProjectsController> logger)
        {
            _projectService = projectService;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<OngoingProjectDto>>> GetOngoingProjects(
            [FromQuery] string status = "in_progress",
            [FromQuery] string committee = "الكل",
            [FromQuery] string year = "الكل",
            [FromQuery] string search = "")
        {
            try
            {
                var projects = await _projectService.GetFilteredOngoingProjectsAsync(status, committee, year, search);
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving ongoing projects");
                return StatusCode(500, new { Error = "An error occurred while retrieving ongoing projects" });
            }
        }

        [HttpGet("completed")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<OngoingProjectDto>>> GetCompletedProjects(
            [FromQuery] string committee = "الكل",
            [FromQuery] string year = "الكل",
            [FromQuery] string search = "")
        {
            try
            {
                var projects = await _projectService.GetCompletedProjectsAsync(committee, year, search);
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving completed projects");
                return StatusCode(500, new { Error = "An error occurred while retrieving completed projects" });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<OngoingProjectDto>> GetOngoingProject(int id)
        {
            try
            {
                var project = await _projectService.GetOngoingProjectByIdAsync(id);
                return Ok(project);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Error = "Project not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving project with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while retrieving the project" });
            }
        }

        [HttpPost]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<ActionResult<OngoingProjectDto>> CreateOngoingProject(OngoingProjectCreateDto projectDto)
        {
            try
            {
                var createdProject = await _projectService.CreateOngoingProjectAsync(projectDto);
                return CreatedAtAction(nameof(GetOngoingProject), new { id = createdProject.Id }, createdProject);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating ongoing project");
                return StatusCode(500, new { Error = "An error occurred while creating the project" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> UpdateOngoingProject(int id, OngoingProjectUpdateDto projectDto)
        {
            if (id != projectDto.Id)
            {
                return BadRequest(new { Error = "Invalid project ID" });
            }

            try
            {
                await _projectService.UpdateOngoingProjectAsync(projectDto);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Error = "Project not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating project with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while updating the project" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireSuperAdminRole")]
        public async Task<IActionResult> DeleteOngoingProject(int id)
        {
            try
            {
                await _projectService.DeleteOngoingProjectAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Error = "Project not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting project with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while deleting the project" });
            }
        }

        [HttpPost("{id}/complete")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> CompleteOngoingProject(int id)
        {
            try
            {
                await _projectService.CompleteOngoingProjectAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Error = "Project not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing project with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while completing the project" });
            }
        }

        [HttpPut("{id}/budget")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> UpdateProjectBudget(int id, BudgetUpdateDto budgetUpdate)
        {
            try
            {
                await _projectService.UpdateProjectBudgetAsync(id, budgetUpdate);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Error = "Project not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating budget for project with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while updating the project budget" });
            }
        }

        [HttpPut("tasks/{taskId}/status")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> UpdateTaskStatus(int taskId, TaskStatusUpdateDto taskStatus)
        {
            try
            {
                await _projectService.UpdateTaskStatusAsync(taskId, taskStatus.Status);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task status for task ID: {TaskId}", taskId);
                return StatusCode(500, new { Error = "An error occurred while updating the task status" });
            }
        }

        [HttpGet("committees")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<string>>> GetCommittees()
        {
            try
            {
                var committees = await _projectService.GetCommitteesAsync();
                return Ok(committees);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving committees");
                return StatusCode(500, new { Error = "An error occurred while retrieving committees" });
            }
        }

        [HttpGet("years")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<int>>> GetProjectYears()
        {
            try
            {
                var years = await _projectService.GetProjectYearsAsync();
                return Ok(years);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving project years");
                return StatusCode(500, new { Error = "An error occurred while retrieving project years" });
            }
        }
    }
}