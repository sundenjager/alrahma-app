using AutoMapper;
using AlRahmaBackend.Models;
using AlRahmaBackend.DTOs;
using System.Collections.Generic;
using System.Linq;

namespace AlRahmaBackend.Mapping
{
    public class SuggestedProgramProfile : Profile
    {
        public SuggestedProgramProfile()
        {
            CreateMap<SuggestedProgramCreateDto, SuggestedProgram>()
                .ForMember(dest => dest.StartDate, opt => opt.MapFrom(src => DateTime.Parse(src.StartDate)))
                .ForMember(dest => dest.CompletionDate, opt => opt.MapFrom(src =>
                    string.IsNullOrEmpty(src.CompletionDate) ? (DateTime?)null : DateTime.Parse(src.CompletionDate)))
                .ForMember(dest => dest.Phases, opt => opt.Ignore())
                .ForMember(dest => dest.ImplementationStatus, opt => opt.MapFrom(src => src.ImplementationStatus));

            CreateMap<SuggestedProgramUpdateDto, SuggestedProgram>()
                .ForMember(dest => dest.StartDate, opt => opt.MapFrom(src =>
                    string.IsNullOrEmpty(src.StartDate) ? DateTime.MinValue : DateTime.Parse(src.StartDate)))
                .ForMember(dest => dest.CompletionDate, opt => opt.MapFrom(src =>
                    string.IsNullOrEmpty(src.CompletionDate) ? (DateTime?)null : DateTime.Parse(src.CompletionDate)))
                .ForMember(dest => dest.Phases, opt => opt.Ignore())
                .ForMember(dest => dest.ImplementationStatus, opt => opt.MapFrom(src => src.ImplementationStatus));

            CreateMap<PhaseDto, Phase>()
                .ForMember(dest => dest.StartDate, opt => opt.MapFrom(src => DateTime.Parse(src.StartDate)))
                .ForMember(dest => dest.EndDate, opt => opt.MapFrom(src => DateTime.Parse(src.EndDate)))
                .ForMember(dest => dest.Tasks, opt => opt.Ignore());

            // **UPDATED: Remove TaskMember mapping - tasks don't have assigned members anymore**
            CreateMap<ProjectTaskDto, ProjectTask>();
                // REMOVED: .ForMember(dest => dest.AssignedMembers, opt => opt.MapFrom(src => GetTaskMembers(src)));

            CreateMap<ProjectTask, ProjectTaskDto>();
                // REMOVED: .ForMember(dest => dest.AssignedMembers, opt => opt.MapFrom(src => ...))
                // REMOVED: .ForMember(dest => dest.MemberNames, opt => opt.Ignore())

            CreateMap<SuggestedProgram, SuggestedProgramReadDto>();
            CreateMap<Phase, PhaseDto>();
            CreateMap<ProgramPartnerDto, ProgramPartner>();
            CreateMap<ProgramPartner, ProgramPartnerDto>();
        }

        // **REMOVED: GetTaskMembers helper method - no longer needed**
    }
}