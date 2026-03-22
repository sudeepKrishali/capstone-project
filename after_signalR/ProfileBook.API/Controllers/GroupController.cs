using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfileBook.API.Data;
using ProfileBook.API.Models;
using System.Security.Claims;

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
    [Authorize(Roles = "Admin")] // Only admin can view all groups
    public async Task<ActionResult<IEnumerable<Group>>> GetAllGroups() =>
        await context.Groups
            .Include(g => g.GroupMembers)
            .ToListAsync();

    [HttpPost("{groupId}/add-member/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AddUserToGroup(int groupId, int userId)
    {
        var group = await context.Groups.FindAsync(groupId);
        if (group == null) return NotFound("Group not found.");

        var user = await context.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");

        user.GroupId = groupId;
        await context.SaveChangesAsync();

        return Ok(user);
    }

    [HttpPost("{groupId}/remove-member/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveUserFromGroup(int groupId, int userId)
    {
        var user = await context.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");

        if (user.GroupId != groupId) return BadRequest("User is not in this group.");

        user.GroupId = null;
        await context.SaveChangesAsync();

        return Ok(user);
    }

    [HttpDelete("{groupId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteGroup(int groupId)
    {
        var group = await context.Groups.FindAsync(groupId);
        if (group == null) return NotFound("Group not found.");

        // Remove group messages
        var groupMessages = await context.GroupMessages
            .Where(m => m.GroupId == groupId)
            .ToListAsync();
        if (groupMessages.Count > 0)
        {
            context.GroupMessages.RemoveRange(groupMessages);
        }

        // Detach users from this group
        var members = await context.Users
            .Where(u => u.GroupId == groupId)
            .ToListAsync();
        foreach (var member in members)
        {
            member.GroupId = null;
        }

        context.Groups.Remove(group);
        await context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("my-group")]
    [Authorize]
    public async Task<ActionResult<Group?>> GetCurrentUserGroup()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await context.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");

        if (user.GroupId == null) return Ok(null);

        var group = await context.Groups
            .Include(g => g.GroupMembers)
            .FirstOrDefaultAsync(g => g.GroupId == user.GroupId);

        return group == null ? NotFound("Group not found.") : Ok(group);
    }

    [HttpGet("my-group/messages")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<GroupMessageResponse>>> GetMyGroupMessages()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();
        if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

        var user = await context.Users.FindAsync(userId);
        if (user == null || user.GroupId == null) return Ok(Array.Empty<GroupMessageResponse>());

        var messages = await context.GroupMessages
            .Where(m => m.GroupId == user.GroupId)
            .Include(m => m.Sender)
            .OrderBy(m => m.TimeStamp)
            .Select(m => new GroupMessageResponse
            {
                GroupMessageId = m.GroupMessageId,
                GroupId = m.GroupId,
                SenderId = m.SenderId,
                SenderName = m.Sender != null ? m.Sender.Username : null,
                MessageContent = m.MessageContent,
                TimeStamp = m.TimeStamp
            })
            .ToListAsync();

        return Ok(messages);
    }

    public class GroupMessageDto
    {
        public string MessageContent { get; set; } = string.Empty;
    }

    public class GroupMessageResponse
    {
        public int GroupMessageId { get; set; }
        public int GroupId { get; set; }
        public int SenderId { get; set; }
        public string? SenderName { get; set; }
        public string? MessageContent { get; set; }
        public DateTime TimeStamp { get; set; }
    }

    [HttpPost("my-group/messages")]
    [Authorize]
    public async Task<ActionResult<GroupMessage>> SendMyGroupMessage([FromBody] GroupMessageDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();
        if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

        var user = await context.Users.FindAsync(userId);
        if (user == null || user.GroupId == null) return BadRequest("User is not in any group.");

        if (string.IsNullOrWhiteSpace(dto.MessageContent))
        {
            return BadRequest("Message content is required.");
        }

        var message = new GroupMessage
        {
            GroupId = user.GroupId.Value,
            SenderId = userId,
            MessageContent = dto.MessageContent.Trim(),
            TimeStamp = DateTime.Now
        };

        context.GroupMessages.Add(message);
        await context.SaveChangesAsync();

        return Ok(message);
    }
}
