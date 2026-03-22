using System.ComponentModel.DataAnnotations.Schema;

namespace ProfileBook.API.Models
{
    public class Comment
    {
        public int Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime TimeStamp { get; set; } = DateTime.UtcNow;
        public int PostId { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
    }
}
