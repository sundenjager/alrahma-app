using AlRahmaBackend.Data;
using AlRahmaBackend.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AlRahmaBackend.Services
{
    public class MemberService : IMemberService
    {
        private readonly ApplicationDbContext _context;

        public MemberService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Member> GetMemberByIdAsync(int memberId)
        {
            return await _context.Members.FindAsync(memberId);
        }

        public async Task<IEnumerable<Member>> GetAllMembersAsync()
        {
            return await _context.Members.ToListAsync();
        }

        public async Task<bool> UpdateMemberAsync(Member member)
        {
            _context.Members.Update(member);
            return await _context.SaveChangesAsync() > 0;
        }

        // Implement GetActiveMembersAsync
        public async Task<IEnumerable<Member>> GetActiveMembersAsync()
        {
            return await _context.Members
                .Where(m => m.IsActive) // Assuming there is an IsActive property in the Member model
                .ToListAsync();
        }

        // Implement GetMemberAsync
        public async Task<Member> GetMemberAsync(int memberId)
        {
            return await _context.Members
                .FirstOrDefaultAsync(m => m.Id == memberId);
        }
    }
}