using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfileBook.API.Controllers;
using ProfileBook.API.Models;
using ProfileBook.API.Data;
using ProfileBook.Tests.Helpers; 
using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace ProfileBook.Tests.Controllers
{
    public class GroupControllerTests
    {
        [Fact]
        public async Task CreateGroup_ReturnsOkResult_WithValidGroup()
        {
            // 1. Arrange
            var context = TestDataHelper.GetInMemoryDbContext();
            var controller = new GroupController(context);

            // Mocking an Admin user so the request is authorized
            TestDataHelper.MockCurrentUser(controller, "1", "Admin");

            var newGroup = new Group
            {
                GroupName = "Designers Team"
            };

            // 2. Act
            var result = await controller.CreateGroup(newGroup);

            // 3. Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedGroup = Assert.IsType<Group>(okResult.Value);

            Assert.Equal("Designers Team", returnedGroup.GroupName);
            Assert.Equal(1, context.Groups.Count());
        }

        [Fact]
        public async Task GetAllGroups_ReturnsAllGroupsWithMembers()
        {
            // 1. Arrange
            var context = TestDataHelper.GetInMemoryDbContext();

            // Seed the database with a test group
            context.Groups.Add(new Group { GroupName = "Developers" });
            await context.SaveChangesAsync();

            var controller = new GroupController(context);
            TestDataHelper.MockCurrentUser(controller, "1");

            // 2. Act
            var result = await controller.GetAllGroups();

            // 3. Assert
            var actionResult = Assert.IsType<ActionResult<IEnumerable<Group>>>(result);
            var groups = Assert.IsAssignableFrom<IEnumerable<Group>>(actionResult.Value);
            Assert.Single(groups);
        }
    }
}
