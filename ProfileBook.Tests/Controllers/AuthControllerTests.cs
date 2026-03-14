using Microsoft.AspNetCore.Mvc;
using Moq;
using ProfileBook.API.Controllers;
using ProfileBook.API.Models;
using ProfileBook.API.Services;
using ProfileBook.API.Data;
using ProfileBook.Tests.Helpers;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace ProfileBook.Tests.Controllers
{
    public class AuthControllerTests
    {
        private readonly Mock<ITokenService> _mockTokenService;
        private readonly ApplicationDbContext _context;

        public AuthControllerTests()
        {
            _mockTokenService = new Mock<ITokenService>();
            _context = TestDataHelper.GetInMemoryDbContext();
        }

        [Fact]
        public async Task Register_ShouldSaveUser_WhenValidDataAndImageProvided()
        {
            // Arrange
            var controller = new AuthController(_context, _mockTokenService.Object);

            // Using your specific RegisterDto and the Mock File Helper
            var registerDto = new AuthController.RegisterDto
            {
                Username = "testuser",
                Password = "Password123",
                ProfileImage = TestDataHelper.CreateMockFormFile("avatar.jpg")
            };

            // Act
            var result = await controller.Register(registerDto);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            var userInDb = _context.Users.FirstOrDefault(u => u.Username == "testuser");
            Assert.NotNull(userInDb);
            Assert.Equal("User", userInDb.Role);
            Assert.Contains("avatar.jpg", userInDb.ProfileImage); // Verify image path was saved
        }

        [Fact]
        public async Task Login_ShouldReturnToken_WhenCredentialsAreValid()
        {
            // Arrange
            var user = new User { Username = "validuser", Password = "correctpassword", Role = "User" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _mockTokenService.Setup(s => s.CreateToken(It.IsAny<User>())).Returns("fake-jwt-token");

            var controller = new AuthController(_context, _mockTokenService.Object);
            var loginDto = new User { Username = "validuser", Password = "correctpassword" };

            // Act
            var result = await controller.Login(loginDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            // Verify the token service was actually called
            _mockTokenService.Verify(s => s.CreateToken(It.IsAny<User>()), Times.Once);
        }
    }
}