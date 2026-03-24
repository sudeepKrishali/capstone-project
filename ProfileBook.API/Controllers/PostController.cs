using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfileBook.API.Data;
using ProfileBook.API.Models;
using System.Security.Claims;

[Route("api/[controller]")]
[ApiController]
public class PostController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Post>>> GetApprovedPosts() =>
    await context.Posts
        .Where(p => p.Status == "Approved")
        .Include(p => p.User) 
        .Include(p => p.Likes)
        .Include(p => p.Comments)
            .ThenInclude(c => c.User)
        .ToListAsync();
  

    [Authorize(Roles = "Admin")]
    [HttpPut("approve/{id}")]
    public async Task<IActionResult> ApprovePost(int id)
    {
        var post = await context.Posts.FindAsync(id);
        if (post == null) return NotFound();
         post.Status = "Approved";
        await context.SaveChangesAsync();
        return Ok(new { message = "Post approved" });
    }

    [Authorize]
    [HttpPost("create")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreatePost([FromForm] PostCreateDto postDto)
    {
        if (postDto.Image == null || postDto.Image.Length == 0)
            return BadRequest("Image is required.");

        // 1. Get the current user's ID
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized("User session invalid.");

        // 2. Save the file with a unique name to prevent collisions
        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        // Create a unique filename: timestamp + original filename
        var uniqueFileName = $"{Guid.NewGuid()}_{postDto.Image.FileName}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await postDto.Image.CopyToAsync(stream);
        }

        // 3. Map with UserId and the unique path
        var post = new Post
        {
            Content = postDto.Content,
            PostImage = "/uploads/" + uniqueFileName, // Store relative path
            Status = "Pending",
            UserId = int.Parse(userIdClaim)
        };

        context.Posts.Add(post);
        await context.SaveChangesAsync();

        return Ok(post);
    }

    [Authorize]
    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdatePost(int id, [FromForm] PostUpdateDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized("User session invalid.");

        var post = await context.Posts.FindAsync(id);
        if (post == null) return NotFound();

        var userId = int.Parse(userIdClaim);
        if (post.UserId != userId) return Forbid();

        if (dto.Content != null)
            post.Content = dto.Content;

        if (dto.Image is { Length: > 0 })
        {
            TryDeletePostImageFile(post.PostImage);

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}_{dto.Image.FileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);
            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await dto.Image.CopyToAsync(stream);
            }

            post.PostImage = "/uploads/" + uniqueFileName;
        }

        await context.SaveChangesAsync();
        return Ok(post);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePost(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized("User session invalid.");

        var post = await context.Posts.FindAsync(id);
        if (post == null) return NotFound();

        if (post.UserId != int.Parse(userIdClaim)) return Forbid();

        TryDeletePostImageFile(post.PostImage);
        context.Posts.Remove(post);
        await context.SaveChangesAsync();
        return NoContent();
    }

    static void TryDeletePostImageFile(string? postImageRelative)
    {
        if (string.IsNullOrEmpty(postImageRelative)) return;
        var relative = postImageRelative.TrimStart('/');
        if (!relative.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase)) return;

        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relative);
        try
        {
            if (System.IO.File.Exists(fullPath))
                System.IO.File.Delete(fullPath);
        }
        catch
        {
            // Ignore file IO errors so DB delete still succeeds
        }
    }

    // DTO class for creating a post with an image
    public class PostCreateDto
    {
        public string? Content { get; set; }
        public IFormFile? Image { get; set; }
    }

    public class PostUpdateDto
    {
        public string? Content { get; set; }
        public IFormFile? Image { get; set; }
    }

    [Authorize]
    [HttpPost("{postId}/like")]
    public async Task<IActionResult> LikePost(int postId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? User.FindFirst(ClaimTypes.Name)?.Value;

        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

        int userId = int.Parse(userIdClaim);
        var existingLike = await context.Likes
            .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);

        if (existingLike == null)
            context.Likes.Add(new Like { PostId = postId, UserId = userId });
        else
            context.Likes.Remove(existingLike);

        await context.SaveChangesAsync();
        return Ok();
    }

    [Authorize]
    [HttpPost("{postId}/comment")]
    public async Task<IActionResult> AddComment(int postId, [FromBody] CommentDto commentDto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? User.FindFirst(ClaimTypes.Name)?.Value;

        if (userIdClaim == null) return Unauthorized();

        var comment = new Comment
        {
            PostId = postId,
            Text = commentDto.Text,
            UserId = int.Parse(userIdClaim),
            TimeStamp = DateTime.UtcNow
        };

        context.Comments.Add(comment);
        await context.SaveChangesAsync();
        return Ok(comment);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("pending")]
    public async Task<ActionResult<IEnumerable<Post>>> GetPendingPosts() =>
    await context.Posts
        .Where(p => p.Status == "Pending")
        .Include(p => p.User)
        .ToListAsync();

    public class CommentDto
    {
        public string Text { get; set; } = string.Empty;
    }

}
