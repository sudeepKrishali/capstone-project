using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProfileBook.API.Controllers;
using ProfileBook.API.Data;
using ProfileBook.API.Models;
using ProfileBook.Tests.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace ProfileBook.Tests.Controllers
{
    public class ReportControllerTests
    {
        [Fact]
        public async Task ReportUser_ShouldSaveReport_AndReturnOk()
        {
            // Arrange
            var context = TestDataHelper.GetInMemoryDbContext();
            var controller = new ReportController(context);

            var report = new Report
            {
                ReportingUserId = 1,
                ReportedUserId = 2,
                Reason = "Inappropriate behavior"
            };

            // Act
            var result = await controller.ReportUser(report);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);

            var savedReport = await context.Reports.FirstOrDefaultAsync(r => r.ReportId == report.ReportId);
            Assert.NotNull(savedReport);
            Assert.Equal(1, savedReport.ReportingUserId);
            Assert.Equal(2, savedReport.ReportedUserId);
            Assert.Equal("Inappropriate behavior", savedReport.Reason);
            Assert.True(savedReport.TimeStamp <= DateTime.UtcNow);
        }

        [Fact]
        public async Task GetReports_ShouldReturnAllReports()
        {
            // Arrange
            var context = TestDataHelper.GetInMemoryDbContext();

            context.Reports.AddRange(
                new Report { ReportingUserId = 1, ReportedUserId = 2, Reason = "Spam", TimeStamp = DateTime.UtcNow.AddMinutes(-3) },
                new Report { ReportingUserId = 3, ReportedUserId = 4, Reason = "Harassment", TimeStamp = DateTime.UtcNow.AddMinutes(-2) }
            );
            await context.SaveChangesAsync();

            var controller = new ReportController(context);

            // Act
            var result = await controller.GetReports();

            // Assert
            var actionResult = Assert.IsType<ActionResult<IEnumerable<Report>>>(result);
            var reports = Assert.IsAssignableFrom<IEnumerable<Report>>(actionResult.Value);
            Assert.Equal(2, reports.Count());
        }
    }
}

