

using System.ComponentModel.DataAnnotations.Schema;

namespace ProfileBook.API.Models
{
    public class Report
    {
        public int ReportId { get; set; } // Primary Key

        public int ReportedUserId { get; set; }

        [ForeignKey("ReportedUserId")]
        public virtual User? ReportedUser { get; set; }

        public int ReportingUserId { get; set; }

        [ForeignKey("ReportingUserId")]
        public virtual User? ReportingUser { get; set; }

        public string? Reason { get; set; }
        public DateTime TimeStamp { get; set; } = DateTime.Now;
    }
}
