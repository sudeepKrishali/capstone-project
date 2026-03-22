namespace ProfileBook.API.Models
{
    public class Message
    {
        public int MessageId { get; set; } // Primary Key 
        public int SenderId { get; set; } // Foreign Key 
        public int ReceiverId { get; set; } // Foreign Key
        public string? MessageContent { get; set; }
        public DateTime TimeStamp { get; set; } = DateTime.Now; 

        // Navigation properties
        public User? Sender { get; set; }
        public User? Receiver { get; set; }
    }
}
