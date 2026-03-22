namespace ProfileBook.API.Models
{
    public class Post
    {
        public int PostId { get; set; } // Primary Key 
        public int UserId { get; set; } // Foreign Key to User 
        public string? Content { get; set; }
        public string? PostImage { get; set; }
        public string Status { get; set; } = "Pending"; // "Pending", "Approved", "Rejected" 

        // Navigation property
        public User? User { get; set; }
        public ICollection<Like> Likes { get; set; } = new List<Like>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    }
}
