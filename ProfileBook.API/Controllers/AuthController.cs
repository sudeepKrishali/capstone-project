using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProfileBook.API.Data;
using ProfileBook.API.Models;
using ProfileBook.API.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

[Route("api/[controller]")]
[ApiController]
public class AuthController(ApplicationDbContext context, TokenService tokenService) : ControllerBase
{
    [HttpPost("register")]
    [Consumes("multipart/form-data")] 
    public async Task<IActionResult> Register([FromForm] RegisterDto registerDto)
    {
        string? imagePath = null;

        // 1. Handle File Upload
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

        // 2. Map to User
        var user = new User
        {
            Username = registerDto.Username,
            Password = registerDto.Password, // Ensure you hash this!
            ProfileImage = imagePath,
            Role = "User"
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();
        return Ok(new { message = "Registration successful" });
    }

    public class RegisterDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public IFormFile? ProfileImage { get; set; } // The file upload
    }


    [HttpPost("login")]
    public async Task<IActionResult> Login(User loginDto)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Username == loginDto.Username && u.Password == loginDto.Password);
        if (user == null) return Unauthorized("Invalid credentials");

        // Simply call the method on the service. No need to define keys here.
        return Ok(new { token = tokenService.CreateToken(user) });
    }

}
