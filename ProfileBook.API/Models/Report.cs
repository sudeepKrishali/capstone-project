namespace ProfileBook.API.Models
{
    public class Report
    {
        public int ReportId { get; set; } // Primary Key 
        public int ReportedUserId { get; set; }
        public int ReportingUserId { get; set; }
        public string? Reason { get; set; }
        public DateTime TimeStamp { get; set; } = DateTime.Now; 
    }
}
