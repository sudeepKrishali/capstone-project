using Microsoft.AspNetCore.Http; // Needed for IFormFile
using Microsoft.AspNetCore.Mvc;
using ProfileBook.API.Controllers;
using ProfileBook.API.Data;
using ProfileBook.API.Models;
using ProfileBook.Tests.Helpers;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using static PostController;

namespace ProfileBook.Tests.Controllers
{
    public class PostControllerTests
    {
        [Fact]
        public async Task LikePost_ReturnsOk_WhenUserIsAuthenticated()
        {
            // Arrange
            var context = TestDataHelper.GetInMemoryDbContext();
            var controller = new PostController(context);
            TestDataHelper.MockCurrentUser(controller, "1");

            // Act
            var result = await controller.LikePost(101);

            // Assert
            Assert.IsType<OkResult>(result);
            Assert.Equal(1, context.Likes.Count());
        }

        [Fact]
        public async Task AddComment_ReturnsOk_WithDynamicUserId()
        {
            // Arrange
            var context = TestDataHelper.GetInMemoryDbContext();
            var controller = new PostController(context);
            TestDataHelper.MockCurrentUser(controller, "5"); // Simulating User ID 5

            var commentDto = new CommentDto { Text = "Great post!" };

            // Act
            var result = await controller.AddComment(101, commentDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedComment = Assert.IsType<Comment>(okResult.Value);
            Assert.Equal(5, returnedComment.UserId); // Verify it used the ID from the token
            Assert.Equal("Great post!", returnedComment.Text);
        }
    }
}
