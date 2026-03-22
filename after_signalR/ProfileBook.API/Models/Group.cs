namespace ProfileBook.API.Models
{
    public class Group
    {
        public int GroupId { get; set; } // Primary Key
        public string? GroupName { get; set; }
        public ICollection<User>? GroupMembers { get; set; }
    }
}
