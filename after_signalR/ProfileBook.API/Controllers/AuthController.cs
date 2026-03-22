using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfileBook.API.Data;
using ProfileBook.API.Models;
using ProfileBook.API.Services;

[Route("api/[controller]")]
[ApiController]
public class AuthController(ApplicationDbContext context, ITokenService tokenService) : ControllerBase
{
    [HttpPost("register")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Register([FromForm] RegisterDto registerDto)
    {
        string? imagePath = null;

        if (registerDto.ProfileImage != null && registerDto.ProfileImage.Length > 0)
        {
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}_{registerDto.ProfileImage.FileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await registerDto.ProfileImage.CopyToAsync(stream);
            }
            imagePath = "/uploads/" + uniqueFileName;
        }

        var user = new User
        {
            Username = registerDto.Username,
            Password = registerDto.Password,
            ProfileImage = imagePath,
            Role = "User"
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();
        return Ok(new { message = "Registration successful" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        var user = await context.Users.FirstOrDefaultAsync(u =>
            u.Username == loginDto.Username && u.Password == loginDto.Password);

        if (user == null) return Unauthorized("Invalid credentials");

        var token = tokenService.CreateToken(user);
        return Ok(new { token });
    }
}

public class RegisterDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public IFormFile? ProfileImage { get; set; }
}

public class LoginDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}