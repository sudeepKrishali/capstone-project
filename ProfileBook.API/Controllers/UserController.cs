using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfileBook.API.Data;
using ProfileBook.API.Models;
using System.Security.Claims;

[Route("api/[controller]")]
[ApiController]
public class UserController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetUsers() => await context.Users.ToListAsync();

    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetUser(int id)
    {
        var user = await context.Users.FindAsync(id);
        return user == null ? NotFound() : user;
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await context.Users.FindAsync(id);
        if (user == null) return NotFound();

        // Remove related data that has restrictive foreign keys

        // Messages where the user is sender or receiver
        var relatedMessages = await context.Messages
            .Where(m => m.SenderId == id || m.ReceiverId == id)
            .ToListAsync();
        if (relatedMessages.Count > 0)
        {
            context.Messages.RemoveRange(relatedMessages);
        }

        // Reports where the user is reporter or reported
        var relatedReports = await context.Reports
            .Where(r => r.ReportingUserId == id || r.ReportedUserId == id)
            .ToListAsync();
        if (relatedReports.Count > 0)
        {
            context.Reports.RemoveRange(relatedReports);
        }

        // Comments made by the user
        var relatedComments = await context.Comments
            .Where(c => c.UserId == id)
            .ToListAsync();
        if (relatedComments.Count > 0)
        {
            context.Comments.RemoveRange(relatedComments);
        }

        // Likes made by the user
        var relatedLikes = await context.Likes
            .Where(l => l.UserId == id)
            .ToListAsync();
        if (relatedLikes.Count > 0)
        {
            context.Likes.RemoveRange(relatedLikes);
        }

        // First save removal of related entities so FK constraints are satisfied
        await context.SaveChangesAsync();

        // Finally remove the user (posts and their comments/likes should cascade from the Post relationship)
        context.Users.Remove(user);
        await context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("search/{name}")]
    public async Task<ActionResult<IEnumerable<User>>> SearchUsers(string name)
    {
        return await context.Users
            .Where(u => u.Username != null && u.Username.Contains(name))
            .ToListAsync();
    }

    [Authorize]
    [HttpPut("update-profile-image")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateProfileImage([FromForm] ProfileImageUpdateDto input)
    {
        var profileImage = input.ProfileImage; // Access the file here
        if (profileImage == null || profileImage.Length == 0)
            return BadRequest("Image is required.");

        // 1. Get UserId from the token
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized();
        int userId = int.Parse(userIdClaim);

        // 2. Find the user in the database
        var user = await context.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");

        // 3. Delete old image if it exists (Optional but recommended)
        if (!string.IsNullOrEmpty(user.ProfileImage))
        {
            var oldPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.ProfileImage.TrimStart('/'));
            if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
        }

        // 4. Save new image
        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
        var uniqueFileName = $"{Guid.NewGuid()}_{profileImage.FileName}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await profileImage.CopyToAsync(stream);
        }

        // 5. Update database record
        user.ProfileImage = "/uploads/" + uniqueFileName;
        await context.SaveChangesAsync();

        return Ok(new { message = "Profile image updated successfully.", path = user.ProfileImage });
    }

    public class ProfileImageUpdateDto
    {
        public IFormFile ProfileImage { get; set; } = null!;
    }
}