using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfileBook.API.Data;
using ProfileBook.API.Models;

[Route("api/[controller]")]
[ApiController]
public class GroupController(ApplicationDbContext context) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = "Admin")] // Only  "Admin" can access this
    public async Task<IActionResult> CreateGroup(Group group)
    {
        context.Groups.Add(group);
        await context.SaveChangesAsync();
        return Ok(group);
    }

    [HttpGet]
    [Authorize] // Any logged-in user can view groups
    public async Task<ActionResult<IEnumerable<Group>>> GetAllGroups() =>
        await context.Groups.Include(g => g.GroupMembers).ToListAsync();
}
