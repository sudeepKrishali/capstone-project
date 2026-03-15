using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfileBook.API.Controllers;
using ProfileBook.API.Data;
using ProfileBook.API.Models;
using ProfileBook.Tests.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace ProfileBook.Tests.Controllers
{
    public class MessageControllerTests
    {
        [Fact]
        public async Task SendMessage_ShouldSaveMessage_AndReturnOk()
        {
            // Arrange
            var context = TestDataHelper.GetInMemoryDbContext();
            var controller = new MessageController(context);

            var message = new Message
            {
                SenderId = 1,
                ReceiverId = 2,
                MessageContent = "Hello there!"
            };

            // Act
            var result = await controller.SendMessage(message);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);

            // Ensure message is persisted
            var savedMessage = await context.Messages.FirstOrDefaultAsync(m => m.MessageId == message.MessageId);
            Assert.NotNull(savedMessage);
            Assert.Equal("Hello there!", savedMessage.MessageContent);
            Assert.Equal(1, savedMessage.SenderId);
            Assert.Equal(2, savedMessage.ReceiverId);
            Assert.True(savedMessage.TimeStamp <= DateTime.UtcNow);
        }

        [Fact]
        public async Task GetChat_ShouldReturnMessagesBetweenTwoUsers()
        {
            // Arrange
            var context = TestDataHelper.GetInMemoryDbContext();

            context.Messages.AddRange(
                new Message { SenderId = 1, ReceiverId = 2, MessageContent = "Hi", TimeStamp = DateTime.UtcNow.AddMinutes(-2) },
                new Message { SenderId = 2, ReceiverId = 1, MessageContent = "Hello", TimeStamp = DateTime.UtcNow.AddMinutes(-1) },
                new Message { SenderId = 3, ReceiverId = 1, MessageContent = "Unrelated", TimeStamp = DateTime.UtcNow }
            );
            await context.SaveChangesAsync();

            var controller = new MessageController(context);

            // Act
            var result = await controller.GetChat(1, 2);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedMessages = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value);

            Assert.Equal(2, returnedMessages.Count());
        }
    }
}

