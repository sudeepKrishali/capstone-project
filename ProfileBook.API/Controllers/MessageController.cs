using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfileBook.API.Data;
using ProfileBook.API.Models;

[Route("api/[controller]")]
[ApiController]
public class MessageController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet("chat/{user1Id}/{user2Id}")]
    public async Task<ActionResult<IEnumerable<Message>>> GetChat(int user1Id, int user2Id) =>
        await context.Messages.Where(m => (m.SenderId == user1Id && m.ReceiverId == user2Id) ||
                                          (m.SenderId == user2Id && m.ReceiverId == user1Id))
                              .OrderBy(m => m.TimeStamp).ToListAsync();

    [HttpPost]
    public async Task<ActionResult<Message>> SendMessage(Message message)
    {
         message.TimeStamp = DateTime.UtcNow; 
        context.Messages.Add(message);
        await context.SaveChangesAsync();
        return Ok(message);
    }
}