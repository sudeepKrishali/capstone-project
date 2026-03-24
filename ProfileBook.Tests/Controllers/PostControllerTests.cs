using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

        [Fact]
        public async Task UpdatePost_ReturnsOk_AndUpdatesContent_WhenOwner()
        {
            var context = TestDataHelper.GetInMemoryDbContext();
            context.Users.Add(new User
            {
                UserId = 1,
                Username = "u1",
                Password = "x",
                Role = "User"
            });
            context.Posts.Add(new Post
            {
                PostId = 50,
                UserId = 1,
                Content = "old",
                PostImage = "/uploads/old.jpg",
                Status = "Approved"
            });
            await context.SaveChangesAsync();

            var controller = new PostController(context);
            TestDataHelper.MockCurrentUser(controller, "1");

            var dto = new PostUpdateDto { Content = "new text" };
            var result = await controller.UpdatePost(50, dto);

            var ok = Assert.IsType<OkObjectResult>(result);
            var post = Assert.IsType<Post>(ok.Value);
            Assert.Equal("new text", post.Content);
            Assert.Equal("/uploads/old.jpg", post.PostImage);
        }

        [Fact]
        public async Task UpdatePost_ReturnsForbid_WhenNotOwner()
        {
            var context = TestDataHelper.GetInMemoryDbContext();
            context.Users.AddRange(
                new User { UserId = 1, Username = "a", Password = "x", Role = "User" },
                new User { UserId = 2, Username = "b", Password = "x", Role = "User" });
            context.Posts.Add(new Post
            {
                PostId = 51,
                UserId = 2,
                Content = "theirs",
                Status = "Approved"
            });
            await context.SaveChangesAsync();

            var controller = new PostController(context);
            TestDataHelper.MockCurrentUser(controller, "1");

            var result = await controller.UpdatePost(51, new PostUpdateDto { Content = "hack" });
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task DeletePost_ReturnsNoContent_WhenOwner()
        {
            var context = TestDataHelper.GetInMemoryDbContext();
            context.Users.Add(new User
            {
                UserId = 1,
                Username = "u1",
                Password = "x",
                Role = "User"
            });
            context.Posts.Add(new Post
            {
                PostId = 60,
                UserId = 1,
                Content = "bye",
                Status = "Approved"
            });
            await context.SaveChangesAsync();

            var controller = new PostController(context);
            TestDataHelper.MockCurrentUser(controller, "1");

            var result = await controller.DeletePost(60);
            Assert.IsType<NoContentResult>(result);
            Assert.False(await context.Posts.AnyAsync(p => p.PostId == 60));
        }

        [Fact]
        public async Task DeletePost_ReturnsForbid_WhenNotOwner()
        {
            var context = TestDataHelper.GetInMemoryDbContext();
            context.Users.AddRange(
                new User { UserId = 1, Username = "a", Password = "x", Role = "User" },
                new User { UserId = 2, Username = "b", Password = "x", Role = "User" });
            context.Posts.Add(new Post
            {
                PostId = 61,
                UserId = 2,
                Content = "theirs",
                Status = "Approved"
            });
            await context.SaveChangesAsync();

            var controller = new PostController(context);
            TestDataHelper.MockCurrentUser(controller, "1");

            var result = await controller.DeletePost(61);
            Assert.IsType<ForbidResult>(result);
            Assert.True(await context.Posts.AnyAsync(p => p.PostId == 61));
        }
    }
}
