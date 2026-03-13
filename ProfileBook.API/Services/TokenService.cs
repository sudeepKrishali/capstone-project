using Microsoft.IdentityModel.Tokens;
using ProfileBook.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ProfileBook.API.Services;

public class TokenService
{
    private readonly SymmetricSecurityKey _key;

    public TokenService(IConfiguration config)
    {
        // 1. Get the key from appsettings.json
        var jwtKey = config["Jwt:Key"] ?? "ubP/DBmmk2TcjuT5NcHqGaWSlOk7RPmxwokWkhq2pjCCp02LJHKqZ4frgHXW+VNHAEKEX4MBuxwDWdIPVvKDZg==";

        // 2. Initialize the field
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
    }

    public string CreateToken(User user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, user.Username!),
            new(ClaimTypes.Role, user.Role!),
            new(ClaimTypes.NameIdentifier, user.UserId.ToString()) // Add this for the PostController!
        };

        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha512Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}