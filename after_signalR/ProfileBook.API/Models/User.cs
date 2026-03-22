using System.ComponentModel.DataAnnotations;

namespace ProfileBook.API.Models
{
    public class User
    {
        public int UserId { get; set; } // Primary Key 
        [Required(ErrorMessage = "Username is required.")]
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string? Role { get; set; } // "Admin" or "User" 
        public string? ProfileImage { get; set; }

        public int? GroupId { get; set; }
        public Group? Group { get; set; }

        // Navigation properties
        public ICollection<Post>? Posts { get; set; }
        public ICollection<Message>? SentMessages { get; set; }
        public ICollection<Message>? ReceivedMessages { get; set; }
    }
}
