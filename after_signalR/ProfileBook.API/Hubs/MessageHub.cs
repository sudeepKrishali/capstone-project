using Microsoft.AspNetCore.SignalR;

namespace ProfileBook.API.Hubs
{
    public class MessageHub : Hub
    {
        public async Task JoinUserGroup(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, GetUserGroup(userId));
        }

        public async Task LeaveUserGroup(string userId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetUserGroup(userId));
        }

        public static string GetUserGroup(string userId) => $"user-{userId}";
    }
}
