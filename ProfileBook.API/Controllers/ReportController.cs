using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfileBook.API.Data;
using ProfileBook.API.Models;

namespace ProfileBook.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportController(ApplicationDbContext context) : ControllerBase
    {
        // GET: api/Report (Admin: View all reported users)
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Report>>> GetReports()
        {
            return await context.Reports.ToListAsync(); 
        }

        // POST: api/Report 
        [HttpPost]
        public async Task<ActionResult<Report>> ReportUser(Report report)
        {
            // Set the timestamp automatically
            report.TimeStamp = DateTime.UtcNow; 

            // Add the report object to the Reports DbSet
            context.Reports.Add(report); 

            await context.SaveChangesAsync(); 

            return Ok(new { message = "User reported successfully" });
        }
    }
}
