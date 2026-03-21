using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using ProfileBook.API.Controllers;
using ProfileBook.API.Data;
using ProfileBook.API.Hubs;
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
        private static IHubContext<MessageHub> CreateHubContextMock()
        {
            var clientProxyMock = new Mock<IClientProxy>();
            clientProxyMock
                .Setup(x => x.SendCoreAsync(It.IsAny<string>(), It.IsAny<object?[]>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var hubClientsMock = new Mock<IHubClients>();
            hubClientsMock
                .Setup(x => x.Group(It.IsAny<string>()))
                .Returns(clientProxyMock.Object);

            var hubContextMock = new Mock<IHubContext<MessageHub>>();
            hubContextMock
                .Setup(x => x.Clients)
                .Returns(hubClientsMock.Object);

            return hubContextMock.Object;
        }

        [Fact]
        public async Task SendMessage_ShouldSaveMessage_AndReturnOk()
        {
            // Arrange
            var context = TestDataHelper.GetInMemoryDbContext();
            var controller = new MessageController(context, CreateHubContextMock());

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

            var controller = new MessageController(context, CreateHubContextMock());

            // Act
            var result = await controller.GetChat(1, 2);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedMessages = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value);

            Assert.Equal(2, returnedMessages.Count());
        }
    }
}

