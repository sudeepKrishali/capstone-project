namespace ProfileBook.API.Models
{
    public class GroupMessage
    {
        public int GroupMessageId { get; set; }
        public int GroupId { get; set; }
        public int SenderId { get; set; }
        public string? MessageContent { get; set; }
        public DateTime TimeStamp { get; set; } = DateTime.Now;

        public Group? Group { get; set; }
        public User? Sender { get; set; }
    }
}

