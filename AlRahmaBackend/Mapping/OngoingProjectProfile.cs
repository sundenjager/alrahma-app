using AutoMapper;
using AlRahmaBackend.Models;
using AlRahmaBackend.DTOs;
using System;

namespace AlRahmaBackend.Mapping
{
    public class OngoingProjectProfile : Profile
    {
        public OngoingProjectProfile()
        {
            // Main mappings - UPDATED with all missing properties
            CreateMap<OngoingProject, OngoingProjectDto>()
                .ForMember(dest => dest.Progress, opt => opt.Ignore())
                // Map all the missing properties from OngoingProject to OngoingProjectDto
                .ForMember(dest => dest.ContactPhone, opt => opt.MapFrom(src => src.ContactPhone))
                .ForMember(dest => dest.TargetGroup, opt => opt.MapFrom(src => src.TargetGroup))
                .ForMember(dest => dest.Beneficiaries, opt => opt.MapFrom(src => src.Beneficiaries))
                .ForMember(dest => dest.BeneficiariesCount, opt => opt.MapFrom(src => src.BeneficiariesCount))
                .ForMember(dest => dest.BudgetSource, opt => opt.MapFrom(src => src.BudgetSource))
                .ForMember(dest => dest.FundingStatus, opt => opt.MapFrom(src => src.FundingStatus))
                .ForMember(dest => dest.Details, opt => opt.MapFrom(src => src.Details))
                .ForMember(dest => dest.Notes, opt => opt.MapFrom(src => src.Notes))
                .ForMember(dest => dest.Period, opt => opt.MapFrom(src => src.Period))
                .ForMember(dest => dest.TotalCost, opt => opt.MapFrom(src => src.TotalCost));
                
            CreateMap<OngoingProjectCreateDto, OngoingProject>()
                .ForMember(dest => dest.StartDate, opt => opt.MapFrom(src => 
                    DateTime.Parse(src.StartDate)))
                .ForMember(dest => dest.CompletionDate, opt => opt.MapFrom(src => 
                    string.IsNullOrEmpty(src.CompletionDate) ? null : (DateTime?)DateTime.Parse(src.CompletionDate)))
                .ForMember(dest => dest.Phases, opt => opt.Ignore())
                .ForMember(dest => dest.Partners, opt => opt.Ignore())
                // Map additional properties for create
                .ForMember(dest => dest.ContactPhone, opt => opt.MapFrom(src => src.ContactPhone))
                .ForMember(dest => dest.TargetGroup, opt => opt.MapFrom(src => src.TargetGroup))
                .ForMember(dest => dest.Beneficiaries, opt => opt.MapFrom(src => src.Beneficiaries))
                .ForMember(dest => dest.BeneficiariesCount, opt => opt.MapFrom(src => src.BeneficiariesCount))
                .ForMember(dest => dest.BudgetSource, opt => opt.MapFrom(src => src.BudgetSource))
                .ForMember(dest => dest.FundingStatus, opt => opt.MapFrom(src => src.FundingStatus))
                .ForMember(dest => dest.Details, opt => opt.MapFrom(src => src.Details))
                .ForMember(dest => dest.Notes, opt => opt.MapFrom(src => src.Notes))
                .ForMember(dest => dest.Period, opt => opt.MapFrom(src => src.Period))
                .ForMember(dest => dest.TotalCost, opt => opt.MapFrom(src => src.TotalCost));

            CreateMap<OngoingProjectUpdateDto, OngoingProject>()
                // Map additional properties for update
                .ForMember(dest => dest.ContactPhone, opt => opt.MapFrom(src => src.ContactPhone))
                .ForMember(dest => dest.TargetGroup, opt => opt.MapFrom(src => src.TargetGroup))
                .ForMember(dest => dest.Beneficiaries, opt => opt.MapFrom(src => src.Beneficiaries))
                .ForMember(dest => dest.BeneficiariesCount, opt => opt.MapFrom(src => src.BeneficiariesCount))
                .ForMember(dest => dest.BudgetSource, opt => opt.MapFrom(src => src.BudgetSource))
                .ForMember(dest => dest.FundingStatus, opt => opt.MapFrom(src => src.FundingStatus))
                .ForMember(dest => dest.Details, opt => opt.MapFrom(src => src.Details))
                .ForMember(dest => dest.Notes, opt => opt.MapFrom(src => src.Notes))
                .ForMember(dest => dest.Period, opt => opt.MapFrom(src => src.Period))
                .ForMember(dest => dest.TotalCost, opt => opt.MapFrom(src => src.TotalCost));

            // Phase mappings
            CreateMap<Phase, PhaseDto>();
            CreateMap<PhaseDto, Phase>()
                .ForMember(dest => dest.SuggestedProgramId, opt => opt.Ignore())
                .ForMember(dest => dest.OngoingProjectId, opt => opt.Ignore())
                .ForMember(dest => dest.SuggestedProgram, opt => opt.Ignore())
                .ForMember(dest => dest.OngoingProject, opt => opt.Ignore());

            // Task mappings
            CreateMap<ProjectTask, ProjectTaskDto>();
            CreateMap<ProjectTaskDto, ProjectTask>()
                .ForMember(dest => dest.PhaseId, opt => opt.Ignore())
                .ForMember(dest => dest.Phase, opt => opt.Ignore());

            // ProgramPartner mappings
            CreateMap<ProgramPartner, ProgramPartnerDto>();
            CreateMap<ProgramPartnerDto, ProgramPartner>()
                .ForMember(dest => dest.SuggestedProgramId, opt => opt.Ignore())
                .ForMember(dest => dest.OngoingProjectId, opt => opt.Ignore())
                .ForMember(dest => dest.SuggestedProgram, opt => opt.Ignore())
                .ForMember(dest => dest.OngoingProject, opt => opt.Ignore());
        }
    }
}