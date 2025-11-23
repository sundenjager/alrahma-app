using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;

namespace AlRahmaBackend.DTOs
{

  public class DonsCreateDto
  {
      public string Reference { get; set; }
      public string Category { get; set; }
      public string Brand { get; set; }
      public string Source { get; set; }
      public string Usage { get; set; }
      public DateTime? DateOfEntry { get; set; }
      public DateTime? DateOfExit { get; set; }
      public string? Status { get; set; }
      public string? Description { get; set; }
      public string Nature { get; set; }
      public string DonsType { get; set; }
      public string DonsScope { get; set; }
      public decimal? MonetaryValue { get; set; }
      public string? TestatorNationality { get; set; }
      public string? TestamentNature { get; set; }
      public string? TestamentStatus { get; set; }
      public DateTime? RegistrationDate { get; set; }
      public DateTime? ExecutionDate { get; set; }
      
      public IFormFile LegalFile { get; set; }
  }

  public class DonsUpdateDto
  {
    public int Id { get; set; }
    public DateTime? ExecutionDate { get; set; }
    public string TestamentStatus { get; set; }
    public IFormFile LegalFile { get; set; }
    // Add other fields you want to make updatable
  }
  
  public class UpdateExecutionDto
  {
      public DateTime ExecutionDate { get; set; }
  }
}