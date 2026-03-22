using Microsoft.AspNetCore.Mvc;
using ProfileBook.API.Controllers;
using ProfileBook.API.Models;
using ProfileBook.Tests.Helpers;
using System.Threading.Tasks;
using Xunit;
using static UserController;

namespace ProfileBook.Tests.Controllers
{
    public class UserControllerTests
    {
        [Fact]
        public async Task UpdateProfileImage_ReturnsOk_WhenValidImageProvided()
        {
            // Arrange
            var context = TestDataHelper.GetInMemoryDbContext();

            // Seed a user to update
            var user = new User { UserId = 1, Username = "test", Role = "User" };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var controller = new UserController(context);
            TestDataHelper.MockCurrentUser(controller, "1");

            var mockFile = TestDataHelper.CreateMockFormFile("profile.jpg");
            var updateDto = new ProfileImageUpdateDto { ProfileImage = mockFile };

            // Act
            var result = await controller.UpdateProfileImage(updateDto);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(user.ProfileImage); // Verify path was updated in DB
        }
    }
}
