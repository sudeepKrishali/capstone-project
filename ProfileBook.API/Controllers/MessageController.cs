using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using ProfileBook.API.Data;
using ProfileBook.API.Hubs;
using ProfileBook.API.Models;

[Route("api/[controller]")]
[ApiController]
public class MessageController(ApplicationDbContext context, IHubContext<MessageHub> hubContext) : ControllerBase
{
    
    [HttpGet("chat/{user1Id}/{user2Id}")]
    public async Task<ActionResult<IEnumerable<object>>> GetChat(int user1Id, int user2Id)
    {
        Console.WriteLine($"[MessageController] GetChat START user1Id={user1Id}, user2Id={user2Id}, time={DateTime.UtcNow:O}");

        var messages = await context.Messages
            .Where(m =>
                (m.SenderId == user1Id && m.ReceiverId == user2Id) ||
                (m.SenderId == user2Id && m.ReceiverId == user1Id))
            .OrderBy(m => m.TimeStamp)
            .Select(m => new
            {
                m.MessageId,
                m.SenderId,
                m.ReceiverId,
                m.MessageContent,
                m.TimeStamp
            })
            .ToListAsync();

        Console.WriteLine($"[MessageController] GetChat END count={messages.Count}, time={DateTime.UtcNow:O}");
        foreach (var message in messages)
        {
            Console.WriteLine(message.MessageContent);
        }

        return Ok(messages);
    }

   
    [HttpPost]
    public async Task<ActionResult<object>> SendMessage(Message message)
    {
        Console.WriteLine($"\n\n*****************[MessageController] SendMessage START from={message.SenderId} to={message.ReceiverId}, time={DateTime.UtcNow:O}");

        message.TimeStamp = DateTime.UtcNow;
        context.Messages.Add(message);
        await context.SaveChangesAsync();

        var result = new
        {
            message.MessageId,
            message.SenderId,
            message.ReceiverId,
            message.MessageContent,
            message.TimeStamp
        };

        await hubContext.Clients.Group(MessageHub.GetUserGroup(message.SenderId.ToString()))
            .SendAsync("ReceiveMessage", result);
        await hubContext.Clients.Group(MessageHub.GetUserGroup(message.ReceiverId.ToString()))
            .SendAsync("ReceiveMessage", result);

        Console.WriteLine($"[MessageController] SendMessage END id={message.MessageId}, time={DateTime.UtcNow:O}");

        return Ok(result);
    }
}