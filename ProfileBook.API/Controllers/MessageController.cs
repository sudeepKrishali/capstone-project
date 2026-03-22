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
                m.TimeStamp,
                m.IsRead
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
        message.IsRead = false;
        context.Messages.Add(message);
        await context.SaveChangesAsync();

        var result = new
        {
            message.MessageId,
            message.SenderId,
            message.ReceiverId,
            message.MessageContent,
            message.TimeStamp,
            message.IsRead
        };

        await hubContext.Clients.Group(MessageHub.GetUserGroup(message.SenderId.ToString()))
            .SendAsync("ReceiveMessage", result);
        await hubContext.Clients.Group(MessageHub.GetUserGroup(message.ReceiverId.ToString()))
            .SendAsync("ReceiveMessage", result);

        Console.WriteLine($"[MessageController] SendMessage END id={message.MessageId}, time={DateTime.UtcNow:O}");

        return Ok(result);
    }

    /// <summary>One row per user the current user has exchanged messages with, ordered by latest activity.</summary>
    [HttpGet("conversations/{userId:int}")]
    public async Task<ActionResult<IEnumerable<object>>> GetConversations(int userId)
    {
        var rows = await context.Messages
            .AsNoTracking()
            .Where(m => m.SenderId == userId || m.ReceiverId == userId)
            .Select(m => new
            {
                m.SenderId,
                m.ReceiverId,
                m.MessageContent,
                m.TimeStamp,
                m.IsRead
            })
            .ToListAsync();

        var otherIds = rows
            .Select(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
            .Distinct()
            .ToList();

        if (otherIds.Count == 0)
            return Ok(Array.Empty<object>());

        var userRows = await context.Users
            .AsNoTracking()
            .Where(u => otherIds.Contains(u.UserId))
            .Select(u => new { u.UserId, u.Username, u.ProfileImage })
            .ToListAsync();

        var users = userRows.ToDictionary(u => u.UserId);

        var summaries = new List<(int otherUserId, string? otherUsername, string? otherProfileImage, string? lastMessagePreview, DateTime lastMessageTime, int unreadCount)>();
        foreach (var otherId in otherIds)
        {
            var thread = rows.Where(m =>
                (m.SenderId == userId && m.ReceiverId == otherId) ||
                (m.SenderId == otherId && m.ReceiverId == userId)).ToList();

            var last = thread.OrderByDescending(m => m.TimeStamp).First();
            var unread = thread.Count(m => m.ReceiverId == userId && m.SenderId == otherId && !m.IsRead);

            if (!users.TryGetValue(otherId, out var u))
                continue;

            summaries.Add((otherId, u.Username, u.ProfileImage, last.MessageContent, last.TimeStamp, unread));
        }

        var ordered = summaries
            .OrderByDescending(x => x.lastMessageTime)
            .Select(x => new
            {
                otherUserId = x.otherUserId,
                otherUsername = x.otherUsername,
                otherProfileImage = x.otherProfileImage,
                lastMessagePreview = x.lastMessagePreview,
                lastMessageTime = x.lastMessageTime,
                unreadCount = x.unreadCount
            })
            .ToList();

        return Ok(ordered);
    }

    /// <summary>Marks all messages from <paramref name="otherUserId"/> to <paramref name="userId"/> as read.</summary>
    [HttpPost("mark-read/{userId:int}/{otherUserId:int}")]
    public async Task<IActionResult> MarkConversationRead(int userId, int otherUserId)
    {
        var unread = await context.Messages
            .Where(m => m.ReceiverId == userId && m.SenderId == otherUserId && !m.IsRead)
            .ToListAsync();

        if (unread.Count == 0)
            return NoContent();

        foreach (var m in unread)
            m.IsRead = true;

        await context.SaveChangesAsync();
        return NoContent();
    }
}