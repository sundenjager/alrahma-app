using AlRahmaBackend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AlRahmaBackend.Services
{
    public interface IMemberService
    {
        Task<Member> GetMemberByIdAsync(int memberId);
        Task<IEnumerable<Member>> GetAllMembersAsync();
        Task<bool> UpdateMemberAsync(Member member);

        // Add the missing methods
        Task<IEnumerable<Member>> GetActiveMembersAsync();
        Task<Member> GetMemberAsync(int memberId);
    }
}