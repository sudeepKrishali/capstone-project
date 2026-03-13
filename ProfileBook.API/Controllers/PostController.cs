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
        await context.Posts.Where(p => p.Status == "Approved").Include(p => p.User).ToListAsync();

    //[HttpPost]
    //public async Task<ActionResult<Post>> CreatePost(Post post)
    //{
    //    post.Status = "Pending"; 
    //    context.Posts.Add(post);
    //    await context.SaveChangesAsync();
    //    return CreatedAtAction(nameof(GetApprovedPosts), new { id = post.PostId }, post);
    //}

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
    // DTO class for creating a post with an image
    public class PostCreateDto
    {
        public string? Content { get; set; }
        public IFormFile? Image { get; set; }
    }

    [Authorize] // Ensure the user is logged in
    [HttpPost("{postId}/like")]
    public async Task<IActionResult> LikePost(int postId)
    {
        // 1. Get the current user's ID from the JWT token
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized("Invalid user session.");
        int userId = int.Parse(userIdClaim);

        // 2. Prevent duplicate likes 
        var alreadyLiked = await context.Likes.AnyAsync(l => l.PostId == postId && l.UserId == userId);
        if (alreadyLiked) return BadRequest("You have already liked this post.");

        var like = new Like { PostId = postId, UserId = userId };
        context.Likes.Add(like);
        await context.SaveChangesAsync();
        return Ok();
    }

    [Authorize]
    [HttpPost("{postId}/comment")]
    public async Task<IActionResult> AddComment(int postId, [FromBody] CommentDto commentDto)
    {
        // 1. Get the current user's ID
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim == null) return Unauthorized("Invalid user session.");
        int userId = int.Parse(userIdClaim);

        var comment = new Comment
        {
            PostId = postId,
            Text = commentDto.Text,
            UserId = userId, 
            TimeStamp = DateTime.UtcNow
        };

        context.Comments.Add(comment);
        await context.SaveChangesAsync();
        return Ok(comment);
    }
    public class CommentDto
    {
        public string Text { get; set; } = string.Empty;
    }

}
