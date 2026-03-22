using Microsoft.Extensions.Configuration;
using Moq;
using ProfileBook.API.Models;
using ProfileBook.API.Services; // Ensure this is the correct namespace for your TokenService
using Xunit;

namespace ProfileBook.Tests.Services
{
    public class TokenServiceTests
    {
        [Fact]
        public void CreateToken_ShouldReturnValidJwtString()
        {
            // Arrange
            var mockConfig = new Mock<IConfiguration>();
            // JWT keys must be at least 32 characters for security
            mockConfig.Setup(c => c["Jwt:Key"]).Returns("ubP/DBmmk2TcjuT5NcHqGaWSlOk7RPmxwokWkhq2pjCCp02LJHKqZ4frgHXW+VNHAEKEX4MBuxwDWdIPVvKDZg==");
            mockConfig.Setup(c => c["Jwt:Issuer"]).Returns("TestIssuer");

            var service = new TokenService(mockConfig.Object);
            var user = new User
            {
                UserId = 1,
                Username = "testuser",
                Role = "Admin"
            };

            // Act
            var token = service.CreateToken(user);

            // Assert
            Assert.NotNull(token);
            Assert.Contains(".", token); // Basic check for JWT format (header.payload.signature)
        }
    }
}
